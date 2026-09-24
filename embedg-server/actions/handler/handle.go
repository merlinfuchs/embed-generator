package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"strconv"
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/snowflake/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/template"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

const (
	roleErrorMessage = "Failed to add or remove role.\n\n" +
		"Please make sure the role is below the 'Embed Generator' role and that the bot has the manage roles permission."
	dmErrorMessage       = "You have blocked the bot from sending you DMs. Please allow DMs from server members in your privacy settings."
	internalErrorMessage = "Something went wrong while handling this interaction."
)

// userError is caused by misconfiguration or missing permissions. It's shown to the user instead of being logged.
type userError struct {
	message string
}

func (e *userError) Error() string {
	return e.message
}

func userErr(format string, args ...any) error {
	return &userError{message: fmt.Sprintf(format, args...)}
}

type ActionHandler struct {
	customCommandStore store.CustomCommandStore
	savedMessageStore  store.SavedMessageStore
	actionSetStore     store.MessageActionSetStore
	kvEntryStore       store.KVEntryStore
	parser             *parser.ActionParser
	planStore          store.PlanStore
	guildState         *guildstate.Provider
}

func New(
	customCommandStore store.CustomCommandStore,
	savedMessageStore store.SavedMessageStore,
	actionSetStore store.MessageActionSetStore,
	kvEntryStore store.KVEntryStore,
	parser *parser.ActionParser,
	planStore store.PlanStore,
	guildState *guildstate.Provider,
) *ActionHandler {
	return &ActionHandler{
		customCommandStore: customCommandStore,
		savedMessageStore:  savedMessageStore,
		actionSetStore:     actionSetStore,
		kvEntryStore:       kvEntryStore,
		parser:             parser,
		planStore:          planStore,
		guildState:         guildState,
	}
}

// HandleActionInteraction shows user errors to the interacting user and returns nil for them.
// Internal errors are returned to the caller and the user only gets a generic message.
func (m *ActionHandler) HandleActionInteraction(restClient rest.Rest, i Interaction) error {
	err := m.handleActionInteraction(restClient, i)
	if err == nil {
		return nil
	}

	message := internalErrorMessage
	var uErr *userError
	if errors.As(err, &uErr) {
		message = uErr.message
		err = nil
	}

	i.Respond(discord.MessageCreate{
		Content: message,
		Flags:   discord.MessageFlagEphemeral,
	})
	return err
}

func (m *ActionHandler) handleActionInteraction(restClient rest.Rest, i Interaction) error {
	interaction := i.Interaction()

	var actionSet actions.ActionSet
	var derivedPerms *actions.ActionDerivedPermissions

	if interaction.Type() == discord.InteractionTypeComponent {
		compInteraction := interaction.(discord.ComponentInteraction)
		data := compInteraction.Data

		if !strings.HasPrefix(data.CustomID(), "action:") {
			return nil
		}

		actionSetID := data.CustomID()[7:]

		if strings.HasPrefix(actionSetID, "options:") {
			// Handle select menu values
			selectData, ok := data.(discord.StringSelectMenuInteractionData)
			if !ok {
				return nil
			}

			// A select menu with min_values 0 can be submitted with nothing selected, which leaves
			// no action set to run.
			if len(selectData.Values) == 0 || !strings.HasPrefix(selectData.Values[0], "action:") {
				return nil
			}

			actionSetID = strings.TrimPrefix(selectData.Values[0], "action:")
		}

		col, err := m.actionSetStore.GetMessageActionSet(context.TODO(), compInteraction.Message.ID, actionSetID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return nil
			}

			return fmt.Errorf("failed to get message action set: %w", err)
		}
		actionSet = col.Actions
		derivedPerms = col.DerivedPermissions
	} else if interaction.Type() == discord.InteractionTypeApplicationCommand {
		appCommandInteraction := interaction.(discord.ApplicationCommandInteraction)
		slashData := appCommandInteraction.SlashCommandInteractionData()
		fullName := slashData.CommandName()
		if slashData.SubCommandGroupName != nil {
			fullName += " " + *slashData.SubCommandGroupName
		}
		if slashData.SubCommandName != nil {
			fullName += " " + *slashData.SubCommandName
		}

		if interaction.GuildID() == nil {
			return nil
		}

		col, err := m.customCommandStore.GetCustomCommandByName(context.TODO(), *interaction.GuildID(), fullName)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return nil
			}

			return fmt.Errorf("failed to get custom command action set: %w", err)
		}
		actionSet = col.Actions
		derivedPerms = col.DerivedPermissions
	} else {
		return fmt.Errorf("invalid interaciont type")
	}

	// For messages created before the permission context was added we don't run permission checks here
	legacyPermissions := derivedPerms == nil

	// DEPRECATED: This has been replaced by templates, it's only here for backwards compatibility
	// TODO: Refactor variables to use disgo types
	// variables := variables.NewContext(
	// 	variables.NewInteractionVariables(interaction),
	// 	variables.NewGuildVariables(interaction.GuildID().String(), s.State, nil),
	// 	variables.NewChannelVariables(interaction.ChannelID, s.State, nil),
	// )

	features, err := m.planStore.GetPlanFeaturesForGuild(context.TODO(), *interaction.GuildID())
	if err != nil {
		return fmt.Errorf("could not get plan features: %w", err)
	}

	templates := template.NewContext(
		"HANDLE_ACTION", features.MaxTemplateOps,
		template.NewInteractionProvider(template.NewSource(context.TODO(), m.guildState), interaction),
		template.NewKVProvider(*interaction.GuildID(), m.kvEntryStore, features.MaxKVKeys),
	)

	for _, action := range actionSet.Actions {
		switch action.Type {
		case actions.ActionTypeTextResponse:
			var flags discord.MessageFlags
			if !action.Public {
				flags = discord.MessageFlagEphemeral
			}

			content, err := templates.ParseAndExecute(action.Text) // TODO: Fix variables.FillString
			if err != nil {
				return templateErr(err)
			}

			allowedMentions := []discord.AllowedMentionType{
				discord.AllowedMentionTypeUsers,
			}
			if action.AllowRoleMentions {
				allowedMentions = append(
					allowedMentions,
					discord.AllowedMentionTypeRoles,
					discord.AllowedMentionTypeEveryone,
				)
			}

			i.Respond(discord.MessageCreate{
				Content: content,
				Flags:   flags,
				AllowedMentions: &discord.AllowedMentions{
					Parse: allowedMentions,
				},
			})
		case actions.ActionTypeToggleRole:
			member, roleID, err := roleTarget(interaction, action, derivedPerms, "toggle")
			if err != nil {
				return err
			}

			if slices.Contains(member.RoleIDs, roleID) {
				if err := restClient.RemoveMemberRole(*interaction.GuildID(), member.User.ID, roleID); err != nil {
					return roleErr(err, roleID)
				}
				if !action.DisableDefaultResponse {
					i.Respond(discord.MessageCreate{
						Content: fmt.Sprintf("Removed role <@&%s>", roleID),
						Flags:   discord.MessageFlagEphemeral,
					})
				}
			} else {
				if err := restClient.AddMemberRole(*interaction.GuildID(), member.User.ID, roleID); err != nil {
					return roleErr(err, roleID)
				}
				if !action.DisableDefaultResponse {
					i.Respond(discord.MessageCreate{
						Content: fmt.Sprintf("Added role <@&%s>", roleID),
						Flags:   discord.MessageFlagEphemeral,
					})
				}
			}
		case actions.ActionTypeAddRole:
			member, roleID, err := roleTarget(interaction, action, derivedPerms, "assign")
			if err != nil {
				return err
			}

			if err := restClient.AddMemberRole(*interaction.GuildID(), member.User.ID, roleID); err != nil {
				return roleErr(err, roleID)
			}
			if !action.DisableDefaultResponse {
				i.Respond(discord.MessageCreate{
					Content: fmt.Sprintf("Added role <@&%s>", roleID),
					Flags:   discord.MessageFlagEphemeral,
				})
			}
		case actions.ActionTypeRemoveRole:
			member, roleID, err := roleTarget(interaction, action, derivedPerms, "remove")
			if err != nil {
				return err
			}

			if err := restClient.RemoveMemberRole(*interaction.GuildID(), member.User.ID, roleID); err != nil {
				return roleErr(err, roleID)
			}
			if !action.DisableDefaultResponse {
				i.Respond(discord.MessageCreate{
					Content: fmt.Sprintf("Removed role <@&%s>", roleID),
					Flags:   discord.MessageFlagEphemeral,
				})
			}
		case actions.ActionTypeSavedMessageResponse:
			if interaction.GuildID() == nil {
				continue
			}

			data, err := m.savedMessage(*interaction.GuildID(), action.TargetID)
			if err != nil {
				return err
			}

			// TODO: Fix variables system - variables.FillMessage(data)
			if err := templates.ParseAndExecuteMessage(data); err != nil {
				return templateErr(err)
			}

			if !action.Public {
				data.Flags |= discord.MessageFlagEphemeral
			}

			var components []discord.LayoutComponent
			if !legacyPermissions {
				components, err = m.parser.ParseMessageComponents(data.Components, features.ComponentTypes)
				if err != nil {
					return userErr("Invalid components: %s", err)
				}
			}

			allowedMentions := []discord.AllowedMentionType{
				discord.AllowedMentionTypeUsers,
			}
			if action.AllowRoleMentions {
				allowedMentions = append(
					allowedMentions,
					discord.AllowedMentionTypeRoles,
					discord.AllowedMentionTypeEveryone,
				)
			}

			// We need to get the message id of the response, so it has to be a followup response
			if !i.HasResponded() {
				i.Respond(discord.MessageCreate{
					Flags: data.Flags,
				}, discord.InteractionResponseTypeDeferredCreateMessage)
			}

			newMsg := i.Respond(discord.MessageCreate{
				Content:    data.Content,
				Embeds:     data.Embeds,
				Components: components,
				Flags:      data.Flags,
				AllowedMentions: &discord.AllowedMentions{
					Parse: allowedMentions,
				},
			})
			if newMsg != nil && !legacyPermissions {
				err = m.parser.CreateActionsForMessage(context.TODO(), data.Actions, *derivedPerms, newMsg.ID, !action.Public)
				if err != nil {
					return fmt.Errorf("failed to create actions for message: %w", err)
				}
			}
		case actions.ActionTypeTextDM:
			content, err := templates.ParseAndExecute(action.Text) // TODO: Fix variables system
			if err != nil {
				return templateErr(err)
			}

			if err := sendDM(restClient, interaction.User().ID, discord.MessageCreate{Content: content}); err != nil {
				return err
			}
			i.Respond(discord.MessageCreate{
				Content: "You have received a DM!",
				Flags:   discord.MessageFlagEphemeral,
			})
		case actions.ActionTypeSavedMessageDM:
			if interaction.GuildID() == nil {
				continue
			}

			data, err := m.savedMessage(*interaction.GuildID(), action.TargetID)
			if err != nil {
				return err
			}

			// TODO: Fix variables system - variables.FillMessage(data)
			if err := templates.ParseAndExecuteMessage(data); err != nil {
				return templateErr(err)
			}

			// We support displaying components in DMs, but don't hook them up to actions
			components, err := m.parser.ParseMessageComponents(data.Components, features.ComponentTypes)
			if err != nil {
				return userErr("Invalid components: %s", err)
			}

			err = sendDM(restClient, interaction.User().ID, discord.MessageCreate{
				Content:    data.Content,
				Embeds:     data.Embeds,
				Components: components,
				Flags:      data.Flags,
			})
			if err != nil {
				return err
			}
			i.Respond(discord.MessageCreate{
				Content: "You have received a DM!",
				Flags:   discord.MessageFlagEphemeral,
			})
		case actions.ActionTypeTextEdit:
			content, err := templates.ParseAndExecute(action.Text) // TODO: Fix variables system
			if err != nil {
				return templateErr(err)
			}

			i.Respond(discord.MessageUpdate{
				Content: &content,
			}, discord.InteractionResponseTypeUpdateMessage)
		case actions.ActionTypeSavedMessageEdit:
			if interaction.GuildID() == nil {
				continue
			}

			data, err := m.savedMessage(*interaction.GuildID(), action.TargetID)
			if err != nil {
				return err
			}

			// TODO: Fix variables system - variables.FillMessage(data)
			if err := templates.ParseAndExecuteMessage(data); err != nil {
				return templateErr(err)
			}

			var components []discord.LayoutComponent
			if !legacyPermissions {
				components, err = m.parser.ParseMessageComponents(data.Components, features.ComponentTypes)
				if err != nil {
					return userErr("Invalid components: %s", err)
				}
			}

			newMsg := i.Respond(discord.MessageUpdate{
				Content:    &data.Content,
				Embeds:     &data.Embeds,
				Components: &components,
				Flags:      &data.Flags,
			}, discord.InteractionResponseTypeUpdateMessage)

			if compInteraction, ok := interaction.(discord.ComponentInteraction); ok {
				newMsg = &compInteraction.Message
			}

			if !legacyPermissions && newMsg != nil {
				ephemeral := newMsg.Flags&discord.MessageFlagEphemeral != 0
				err = m.parser.CreateActionsForMessage(context.TODO(), data.Actions, *derivedPerms, newMsg.ID, ephemeral)
				if err != nil {
					return fmt.Errorf("failed to create actions for message: %w", err)
				}
			}
		case actions.ActionTypePermissionCheck:
			perms, _ := strconv.ParseInt(action.Permissions, 10, 64)

			member := interaction.Member()
			if member == nil {
				return userErr("This can only be used in a server.")
			}

			if member.Permissions&discord.Permissions(perms) != discord.Permissions(perms) {
				responseText := "You don't have the required permissions to use this component or command."
				if action.DisableDefaultResponse {
					responseText = action.Text
				}

				i.Respond(discord.MessageCreate{
					Content: responseText,
					Flags:   discord.MessageFlagEphemeral,
				})
				return nil
			}

			responseText := "You don't have the required roles to use this component or command."
			if action.DisableDefaultResponse {
				responseText = action.Text
			}

			if len(action.RoleIDs) != 0 {
				for _, roleID := range action.RoleIDs {
					roleIDSnowflake, err := snowflake.Parse(roleID)
					if err != nil {
						continue
					}
					if !slices.Contains(member.RoleIDs, roleIDSnowflake) {
						i.Respond(discord.MessageCreate{
							Content: responseText,
							Flags:   discord.MessageFlagEphemeral,
						})
						return nil
					}
				}
			}
		}
	}

	if !i.HasResponded() {
		if interaction.Type() == discord.InteractionTypeComponent {
			i.Respond(discord.MessageCreate{}, discord.InteractionResponseTypeDeferredUpdateMessage)
		} else {
			i.Respond(discord.MessageCreate{
				Content: "No response",
				Flags:   discord.MessageFlagEphemeral,
			})
		}
	}

	return nil
}

func templateErr(err error) error {
	return userErr("Failed to execute template variables:\n```%s```", err)
}

func (m *ActionHandler) savedMessage(guildID common.ID, id string) (*actions.MessageWithActions, error) {
	msg, err := m.savedMessageStore.GetSavedMessageForGuild(context.TODO(), guildID, id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return nil, userErr("The saved message used by this action doesn't exist anymore.")
		}
		return nil, fmt.Errorf("failed to get saved message: %w", err)
	}

	data := &actions.MessageWithActions{}
	if err := json.Unmarshal(msg.Data, data); err != nil {
		return nil, fmt.Errorf("failed to unmarshal saved message: %w", err)
	}
	return data, nil
}

// roleTarget resolves the member and role for a role action and checks that the message creator may manage the role.
func roleTarget(
	interaction discord.Interaction,
	action actions.Action,
	derivedPerms *actions.ActionDerivedPermissions,
	verb string,
) (*discord.ResolvedMember, snowflake.ID, error) {
	member := interaction.Member()
	if member == nil {
		return nil, 0, userErr("Roles can only be assigned in a server.")
	}

	roleID, err := snowflake.Parse(action.TargetID)
	if err != nil {
		return nil, 0, userErr("This action has an invalid role configured.")
	}

	// For messages created before the permission context was added we don't run permission checks here
	if derivedPerms != nil && !derivedPerms.CanManageRole(roleID) {
		return nil, 0, userErr("The user that has created this message doesn't have permissions to %s the role <@&%s>.", verb, roleID)
	}
	return member, roleID, nil
}

func roleErr(err error, roleID snowflake.ID) error {
	if common.IsDiscordRestErrorCode(err, rest.JSONErrorCodeLackPermissionsToPerformAction, rest.JSONErrorCodeMissingAccess) {
		return userErr(roleErrorMessage)
	}
	if common.IsDiscordRestErrorCode(err, rest.JSONErrorCodeUnknownRole) {
		return userErr("The role <@&%s> doesn't exist anymore.", roleID)
	}
	return fmt.Errorf("failed to update member role: %w", err)
}

func sendDM(restClient rest.Rest, userID snowflake.ID, msg discord.MessageCreate) error {
	channel, err := restClient.CreateDMChannel(userID, rest.WithCtx(context.TODO()))
	if err != nil {
		return fmt.Errorf("failed to create DM channel: %w", err)
	}

	_, err = restClient.CreateMessage(channel.ID(), msg, rest.WithCtx(context.TODO()))
	if err != nil {
		if common.IsDiscordRestErrorCode(err, rest.JSONErrorCodeCannotSendMessagesToThisUser) {
			return userErr(dmErrorMessage)
		}
		return fmt.Errorf("failed to send DM: %w", err)
	}
	return nil
}

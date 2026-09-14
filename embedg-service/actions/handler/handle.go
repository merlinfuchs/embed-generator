package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"strconv"
	"strings"

	"log/slog"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/snowflake/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/template"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

const roleErrorMessage = "Failed to add or remove role.\n\n" +
	"Please make sure the role is below the 'Embed Generator' role and that the bot has the manage roles permission."

type ActionHandler struct {
	customCommandStore store.CustomCommandStore
	savedMessageStore  store.SavedMessageStore
	actionSetStore     store.MessageActionSetStore
	kvEntryStore       store.KVEntryStore
	parser             *parser.ActionParser
	planStore          store.PlanStore
}

func New(
	customCommandStore store.CustomCommandStore,
	savedMessageStore store.SavedMessageStore,
	actionSetStore store.MessageActionSetStore,
	kvEntryStore store.KVEntryStore,
	parser *parser.ActionParser,
	planStore store.PlanStore,
) *ActionHandler {
	return &ActionHandler{
		customCommandStore: customCommandStore,
		savedMessageStore:  savedMessageStore,
		actionSetStore:     actionSetStore,
		kvEntryStore:       kvEntryStore,
		parser:             parser,
		planStore:          planStore,
	}
}

func (m *ActionHandler) HandleActionInteraction(restClient rest.Rest, i Interaction) error {
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
			if selectData, ok := data.(discord.StringSelectMenuInteractionData); ok {
				actionSetID = selectData.Values[0][7:]
			}
		}

		col, err := m.actionSetStore.GetMessageActionSet(context.TODO(), compInteraction.Message.ID, actionSetID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return nil
			}

			slog.Error("Failed to get message action set", slog.Any("error", err))
			return err
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

			slog.Error("Failed to get custom command action set", slog.Any("error", err))
			return err
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
		template.NewInteractionProvider(nil, interaction), // TODO: Fix caches access
		template.NewKVProvider(*interaction.GuildID(), m.kvEntryStore, features.MaxKVKeys),
	)

	for _, action := range actionSet.Actions {
		switch action.Type {
		case actions.ActionTypeTextResponse:
			var flags discord.MessageFlags
			if !action.Public {
				flags = discord.MessageFlagEphemeral
			}

			content, ok := executeTemplate(i, templates, action.Text) // TODO: Fix variables.FillString
			if !ok {
				return nil
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
			if !legacyPermissions {
				roleID, err := snowflake.Parse(action.TargetID)
				if err != nil {
					slog.Error("Failed to parse role ID", slog.Any("error", err))
					return err
				}
				if !derivedPerms.CanManageRole(roleID) {
					i.Respond(discord.MessageCreate{
						Content: fmt.Sprintf("The user that has created this message doesn't have permissions to toggle the role <@&%s>.", action.TargetID),
						Flags:   discord.MessageFlagEphemeral,
					})
					return nil
				}
			}

			hasRole := false
			if member := interaction.Member(); member != nil {
				for _, roleID := range member.RoleIDs {
					if roleID.String() == action.TargetID {
						hasRole = true
						break
					}
				}
			}

			var err error
			if member := interaction.Member(); member != nil {
				roleID, err := snowflake.Parse(action.TargetID)
				if err != nil {
					slog.Error("Failed to parse role ID", slog.Any("error", err))
					return err
				}

				if hasRole {
					err = restClient.RemoveMemberRole(*interaction.GuildID(), member.User.ID, roleID)
					if err == nil {
						if !action.DisableDefaultResponse {
							i.Respond(discord.MessageCreate{
								Content: fmt.Sprintf("Removed role <@&%s>", action.TargetID),
								Flags:   discord.MessageFlagEphemeral,
							})
						}
					}
				} else {
					err = restClient.AddMemberRole(*interaction.GuildID(), member.User.ID, roleID)
					if err == nil {
						if !action.DisableDefaultResponse {
							i.Respond(discord.MessageCreate{
								Content: fmt.Sprintf("Added role <@&%s>", action.TargetID),
								Flags:   discord.MessageFlagEphemeral,
							})
						}
					}
				}
			}
			if err != nil {
				i.Respond(discord.MessageCreate{
					Content: roleErrorMessage,
					Flags:   discord.MessageFlagEphemeral,
				})
			}
		case actions.ActionTypeAddRole:
			if !legacyPermissions {
				roleID, err := snowflake.Parse(action.TargetID)
				if err != nil {
					slog.Error("Failed to parse role ID", slog.Any("error", err))
					return err
				}
				if !derivedPerms.CanManageRole(roleID) {
					i.Respond(discord.MessageCreate{
						Content: fmt.Sprintf("The user that has created this message doesn't have permissions to assign the role <@&%s>.", action.TargetID),
						Flags:   discord.MessageFlagEphemeral,
					})
					return nil
				}
			}

			if member := interaction.Member(); member != nil {
				roleID, err := snowflake.Parse(action.TargetID)
				if err != nil {
					slog.Error("Failed to parse role ID", slog.Any("error", err))
					return err
				}

				err = restClient.AddMemberRole(*interaction.GuildID(), member.User.ID, roleID)
				if err == nil {
					if !action.DisableDefaultResponse {
						i.Respond(discord.MessageCreate{
							Content: fmt.Sprintf("Added role <@&%s>", action.TargetID),
							Flags:   discord.MessageFlagEphemeral,
						})
					}
				} else {
					i.Respond(discord.MessageCreate{
						Content: roleErrorMessage,
						Flags:   discord.MessageFlagEphemeral,
					})
				}
			}
		case actions.ActionTypeRemoveRole:
			if !legacyPermissions {
				roleID, err := snowflake.Parse(action.TargetID)
				if err != nil {
					slog.Error("Failed to parse role ID", slog.Any("error", err))
					return err
				}
				if !derivedPerms.CanManageRole(roleID) {
					i.Respond(discord.MessageCreate{
						Content: fmt.Sprintf("The user that has created this message doesn't have permissions to remove the role <@&%s>.", action.TargetID),
						Flags:   discord.MessageFlagEphemeral,
					})
					return nil
				}
			}

			if member := interaction.Member(); member != nil {
				roleID, err := snowflake.Parse(action.TargetID)
				if err != nil {
					slog.Error("Failed to parse role ID", slog.Any("error", err))
					return err
				}

				err = restClient.RemoveMemberRole(*interaction.GuildID(), member.User.ID, roleID)
				if err == nil {
					if !action.DisableDefaultResponse {
						i.Respond(discord.MessageCreate{
							Content: fmt.Sprintf("Removed role <@&%s>", action.TargetID),
							Flags:   discord.MessageFlagEphemeral,
						})
					}
				} else {
					i.Respond(discord.MessageCreate{
						Content: roleErrorMessage,
						Flags:   discord.MessageFlagEphemeral,
					})
				}
			}
		case actions.ActionTypeSavedMessageResponse:
			if interaction.GuildID() == nil {
				continue
			}

			msg, err := m.savedMessageStore.GetSavedMessageForGuild(context.TODO(), *interaction.GuildID(), action.TargetID)
			if err != nil {
				return err
			}

			data := &actions.MessageWithActions{}
			err = json.Unmarshal(msg.Data, data)
			if err != nil {
				return err
			}

			// TODO: Fix variables system - variables.FillMessage(data)
			if !executeTemplateMessage(i, templates, data) {
				return nil
			}

			if !action.Public {
				data.Flags |= discord.MessageFlagEphemeral
			}

			var components []discord.LayoutComponent
			if !legacyPermissions {
				components, err = m.parser.ParseMessageComponents(data.Components, features.ComponentTypes)
				if err != nil {
					return fmt.Errorf("Invalid actions: %w", err)
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
					slog.Error("failed to create actions for message", slog.Any("error", err))
					return err
				}
			}
		case actions.ActionTypeTextDM:
			channel, err := restClient.CreateDMChannel(interaction.User().ID, rest.WithCtx(context.TODO()))
			if err != nil {
				slog.Error("Failed to create DM channel", slog.Any("error", err))
				return fmt.Errorf("failed to create DM channel: %w", err)
			}

			_, err = restClient.CreateMessage(channel.ID(), discord.MessageCreate{
				Content: action.Text,
			}, rest.WithCtx(context.TODO()))
			if err != nil {
				if common.IsDiscordRestErrorCode(err, discordgo.ErrCodeCannotSendMessagesToThisUser) {
					i.Respond(discord.MessageCreate{
						Content: "You have blocked the bot from sending you DMs. Please allow DMs from server members in your privacy settings.",
						Flags:   discord.MessageFlagEphemeral,
					})
					return nil
				}
				return fmt.Errorf("failed to send DM: %w", err)
			}
		case actions.ActionTypeSavedMessageDM:
			if interaction.GuildID() == nil {
				continue
			}

			msg, err := m.savedMessageStore.GetSavedMessageForGuild(context.TODO(), *interaction.GuildID(), action.TargetID)
			if err != nil {
				return err
			}

			data := &actions.MessageWithActions{}
			err = json.Unmarshal(msg.Data, data)
			if err != nil {
				return err
			}

			// TODO: Fix variables system - variables.FillMessage(data)
			if !executeTemplateMessage(i, templates, data) {
				return nil
			}

			// We support displaying components in DMs, but don't hook them up to actions
			components, err := m.parser.ParseMessageComponents(data.Components, features.ComponentTypes)
			if err != nil {
				return fmt.Errorf("Invalid actions: %w", err)
			}

			channel, err := restClient.CreateDMChannel(interaction.User().ID, rest.WithCtx(context.TODO()))
			if err != nil {
				slog.Error("Failed to create DM channel", slog.Any("error", err))
				return fmt.Errorf("failed to create DM channel: %w", err)
			}

			_, err = restClient.CreateMessage(channel.ID(), discord.MessageCreate{
				Content:    data.Content,
				Embeds:     data.Embeds,
				Components: components,
				Flags:      data.Flags,
			}, rest.WithCtx(context.TODO()))
			if err != nil {
				slog.Error("Failed to send DM", slog.Any("error", err))
				return fmt.Errorf("failed to send DM: %w", err)
			}
		case actions.ActionTypeTextEdit:
			content, ok := executeTemplate(i, templates, action.Text) // TODO: Fix variables system
			if !ok {
				return nil
			}

			i.Respond(discord.MessageUpdate{
				Content: &content,
			}, discord.InteractionResponseTypeUpdateMessage)
		case actions.ActionTypeSavedMessageEdit:
			if interaction.GuildID() == nil {
				continue
			}

			msg, err := m.savedMessageStore.GetSavedMessageForGuild(context.TODO(), *interaction.GuildID(), action.TargetID)
			if err != nil {
				return err
			}

			data := &actions.MessageWithActions{}
			err = json.Unmarshal(msg.Data, data)
			if err != nil {
				return err
			}

			// TODO: Fix variables system - variables.FillMessage(data)
			if !executeTemplateMessage(i, templates, data) {
				return nil
			}

			var components []discord.LayoutComponent
			if !legacyPermissions {
				components, err = m.parser.ParseMessageComponents(data.Components, features.ComponentTypes)
				if err != nil {
					return fmt.Errorf("Invalid actions: %w", err)
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
					slog.Error("failed to create actions for message", slog.Any("error", err))
					return err
				}
			}
		case actions.ActionTypePermissionCheck:
			perms, _ := strconv.ParseInt(action.Permissions, 10, 64)

			member := interaction.Member()
			if member == nil {
				return fmt.Errorf("member not found")
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

func executeTemplate(i Interaction, templates *template.TemplateContext, text string) (string, bool) {
	res, err := templates.ParseAndExecute(text)
	if err != nil {
		slog.Error("Failed to execute template", slog.Any("error", err))
		i.Respond(discord.MessageCreate{
			Content: fmt.Sprintf("Failed to execute template variables:\n```%s```", err.Error()),
			Flags:   discord.MessageFlagEphemeral,
		})
		return "", false
	}
	return res, true
}

func executeTemplateMessage(i Interaction, templates *template.TemplateContext, m *actions.MessageWithActions) bool {
	if err := templates.ParseAndExecuteMessage(m); err != nil {
		slog.Error("Failed to execute template", slog.Any("error", err))
		i.Respond(discord.MessageCreate{
			Content: fmt.Sprintf("Failed to execute template variables:\n```%s```", err.Error()),
			Flags:   discord.MessageFlagEphemeral,
		})
		return false
	}

	return true
}

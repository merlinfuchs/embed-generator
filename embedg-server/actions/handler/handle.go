package handler

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"slices"
	"strconv"
	"strings"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/template"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/variables"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/rest"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"github.com/rs/zerolog/log"
	"github.com/sqlc-dev/pqtype"
)

const roleErrorMessage = "Failed to add or remove role.\n\n" +
	"Please make sure the role is below the 'Embed Generator' role and that the bot has the manage roles permission."

type ActionHandler struct {
	pg        *postgres.PostgresStore
	parser    *parser.ActionParser
	planStore store.PlanStore
}

func New(pg *postgres.PostgresStore, parser *parser.ActionParser, planStore store.PlanStore) *ActionHandler {
	return &ActionHandler{
		pg:        pg,
		parser:    parser,
		planStore: planStore,
	}
}

func (m *ActionHandler) HandleActionInteraction(s *discordgo.Session, i Interaction) error {
	interaction := i.Interaction()

	var rawActions []byte
	var rawDerivedPerms pqtype.NullRawMessage
	if interaction.Type == discordgo.InteractionMessageComponent {
		data := interaction.MessageComponentData()

		if !strings.HasPrefix(data.CustomID, "action:") {
			return nil
		}

		actionSetID := data.CustomID[7:]

		if strings.HasPrefix(actionSetID, "options:") {
			actionSetID = data.Values[0][7:]
		}

		col, err := m.pg.Q.GetMessageActionSet(context.TODO(), pgmodel.GetMessageActionSetParams{
			MessageID: interaction.Message.ID,
			SetID:     actionSetID,
		})
		if err != nil {
			if err == sql.ErrNoRows {
				return nil
			}

			log.Error().Err(err).Msg("Failed to get message action set")
			return err
		}
		rawActions = col.Actions
		rawDerivedPerms = col.DerivedPermissions
	} else if interaction.Type == discordgo.InteractionApplicationCommand {
		data := interaction.ApplicationCommandData()
		fullName := data.Name
		for _, opt := range data.Options {
			if opt.Type == discordgo.ApplicationCommandOptionSubCommand {
				fullName += " " + opt.Name
			} else if opt.Type == discordgo.ApplicationCommandOptionSubCommandGroup {
				fullName += " " + opt.Name + " " + opt.Options[0].Name
			}
		}

		col, err := m.pg.Q.GetCustomCommandByName(context.TODO(), pgmodel.GetCustomCommandByNameParams{
			Name:    fullName,
			GuildID: interaction.GuildID,
		})
		if err != nil {
			if err == sql.ErrNoRows {
				return nil
			}

			log.Error().Err(err).Msg("Failed to get custom command action set")
			return err
		}
		rawActions = col.Actions
		rawDerivedPerms = col.DerivedPermissions
	} else {
		return fmt.Errorf("invalid interaciont type")
	}

	actionSet := actions.ActionSet{}
	err := json.Unmarshal(rawActions, &actionSet)
	if err != nil {
		log.Error().Err(err).Msg("Failed to unmarshal action set")
		return err
	}

	// For messages created before the permission context was added we don't run permission checks here
	legacyPermissions := true
	derivedPerms := actions.ActionDerivedPermissions{}
	if rawDerivedPerms.Valid {
		err = json.Unmarshal(rawDerivedPerms.RawMessage, &derivedPerms)
		if err != nil {
			log.Error().Err(err).Msg("Failed to unmarshal permission context")
			return err
		}
		legacyPermissions = false
	}

	// DEPRECATED: This has been replaced by templates, it's only here for backwards compatibility
	variables := variables.NewContext(
		variables.NewInteractionVariables(interaction),
		variables.NewGuildVariables(interaction.GuildID, s.State, nil),
		variables.NewChannelVariables(interaction.ChannelID, s.State, nil),
	)

	features, err := m.planStore.GetPlanFeaturesForGuild(context.TODO(), interaction.GuildID)
	if err != nil {
		return fmt.Errorf("could not get plan features: %w", err)
	}

	// TODO: Use global rest client?
	restClient := rest.NewRestClientWithCache(s)

	templates := template.NewContext(
		"HANDLE_ACTION", features.MaxTemplateOps,
		template.NewInteractionProvider(restClient, interaction),
		template.NewKVProvider(interaction.GuildID, m.pg, features.MaxKVKeys),
	)

	for _, action := range actionSet.Actions {
		switch action.Type {
		case actions.ActionTypeTextResponse:
			var flags discordgo.MessageFlags
			if !action.Public {
				flags = discordgo.MessageFlagsEphemeral
			}

			content, ok := executeTemplate(i, templates, variables.FillString(action.Text))
			if !ok {
				return nil
			}

			allowedMentions := []discordgo.AllowedMentionType{
				discordgo.AllowedMentionTypeUsers,
			}
			if action.AllowRoleMentions {
				allowedMentions = append(
					allowedMentions,
					discordgo.AllowedMentionTypeRoles,
					discordgo.AllowedMentionTypeEveryone,
				)
			}

			i.Respond(&discordgo.InteractionResponseData{
				Content: content,
				Flags:   flags,
				AllowedMentions: &discordgo.MessageAllowedMentions{
					Parse: allowedMentions,
				},
			})
		case actions.ActionTypeToggleRole:
			if !legacyPermissions && !derivedPerms.CanManageRole(action.TargetID) {
				i.Respond(&discordgo.InteractionResponseData{
					Content: fmt.Sprintf("The user that has created this message doesn't have permissions to toggle the role <@&%s>.", action.TargetID),
					Flags:   discordgo.MessageFlagsEphemeral,
				})
				return nil
			}

			hasRole := false
			for _, roleID := range interaction.Member.Roles {
				if roleID == action.TargetID {
					hasRole = true
				}
			}

			var err error
			if hasRole {
				err = s.GuildMemberRoleRemove(interaction.GuildID, interaction.Member.User.ID, action.TargetID)
				if err == nil {
					if !action.DisableDefaultResponse {
						i.Respond(&discordgo.InteractionResponseData{
							Content: fmt.Sprintf("Removed role <@&%s>", action.TargetID),
							Flags:   discordgo.MessageFlagsEphemeral,
						})
					}
				}
			} else {
				err = s.GuildMemberRoleAdd(interaction.GuildID, interaction.Member.User.ID, action.TargetID)
				if err == nil {
					if !action.DisableDefaultResponse {
						i.Respond(&discordgo.InteractionResponseData{
							Content: fmt.Sprintf("Added role <@&%s>", action.TargetID),
							Flags:   discordgo.MessageFlagsEphemeral,
						})
					}
				}
			}
			if err != nil {
				log.Error().Err(err).Msg("Failed to toggle role")
				i.Respond(&discordgo.InteractionResponseData{
					Content: roleErrorMessage,
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			}
		case actions.ActionTypeAddRole:
			if !legacyPermissions && !derivedPerms.CanManageRole(action.TargetID) {
				i.Respond(&discordgo.InteractionResponseData{
					Content: fmt.Sprintf("The user that has created this message doesn't have permissions to assign the role <@&%s>.", action.TargetID),
					Flags:   discordgo.MessageFlagsEphemeral,
				})
				return nil
			}

			err := s.GuildMemberRoleAdd(interaction.GuildID, interaction.Member.User.ID, action.TargetID)
			if err == nil {
				if !action.DisableDefaultResponse {
					i.Respond(&discordgo.InteractionResponseData{
						Content: fmt.Sprintf("Added role <@&%s>", action.TargetID),
						Flags:   discordgo.MessageFlagsEphemeral,
					})
				}
			} else {
				log.Error().Err(err).Msg("Failed to add role")
				i.Respond(&discordgo.InteractionResponseData{
					Content: roleErrorMessage,
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			}
		case actions.ActionTypeRemoveRole:
			if !legacyPermissions && !derivedPerms.CanManageRole(action.TargetID) {
				i.Respond(&discordgo.InteractionResponseData{
					Content: fmt.Sprintf("The user that has created this message doesn't have permissions to remove the role <@&%s>.", action.TargetID),
					Flags:   discordgo.MessageFlagsEphemeral,
				})
				return nil
			}

			err := s.GuildMemberRoleRemove(interaction.GuildID, interaction.Member.User.ID, action.TargetID)
			if err == nil {
				if !action.DisableDefaultResponse {
					i.Respond(&discordgo.InteractionResponseData{
						Content: fmt.Sprintf("Removed role <@&%s>", action.TargetID),
						Flags:   discordgo.MessageFlagsEphemeral,
					})
				}
			} else {
				log.Error().Err(err).Msg("Failed to remove role")
				i.Respond(&discordgo.InteractionResponseData{
					Content: roleErrorMessage,
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			}
		case actions.ActionTypeSavedMessageResponse:
			msg, err := m.pg.Q.GetSavedMessageForGuild(context.TODO(), pgmodel.GetSavedMessageForGuildParams{
				GuildID: sql.NullString{Valid: true, String: interaction.GuildID},
				ID:      action.TargetID,
			})
			if err != nil {
				return err
			}

			data := &actions.MessageWithActions{}
			err = json.Unmarshal(msg.Data, data)
			if err != nil {
				return err
			}

			variables.FillMessage(data)
			if !executeTemplateMessage(i, templates, data) {
				return nil
			}

			var flags discordgo.MessageFlags
			if !action.Public {
				flags = discordgo.MessageFlagsEphemeral
			}

			var components []discordgo.MessageComponent
			if !legacyPermissions {
				components, err = m.parser.ParseMessageComponents(data.Components, features.ComponentTypes)
				if err != nil {
					return fmt.Errorf("Invalid actions: %w", err)
				}
			}

			allowedMentions := []discordgo.AllowedMentionType{
				discordgo.AllowedMentionTypeUsers,
			}
			if action.AllowRoleMentions {
				allowedMentions = append(
					allowedMentions,
					discordgo.AllowedMentionTypeRoles,
					discordgo.AllowedMentionTypeEveryone,
				)
			}

			// We need to get the message id of the response, so it has to be a followup response
			if !i.HasResponded() {
				i.Respond(&discordgo.InteractionResponseData{
					Flags: flags,
				}, discordgo.InteractionResponseDeferredChannelMessageWithSource)
			}

			newMsg := i.Respond(&discordgo.InteractionResponseData{
				Content:    data.Content,
				Embeds:     data.Embeds,
				Components: components,
				Flags:      flags,
				AllowedMentions: &discordgo.MessageAllowedMentions{
					Parse: allowedMentions,
				},
			})
			if newMsg != nil && !legacyPermissions {
				err = m.parser.CreateActionsForMessage(context.TODO(), data.Actions, derivedPerms, newMsg.ID, !action.Public)
				if err != nil {
					log.Error().Err(err).Msg("failed to create actions for message")
					return err
				}
			}
		case actions.ActionTypeTextDM:
			dmChannel, err := s.UserChannelCreate(interaction.Member.User.ID)
			if err != nil {
				i.Respond(&discordgo.InteractionResponseData{
					Content: "Failed to send DM",
					Flags:   discordgo.MessageFlagsEphemeral,
				})
				return nil
			}

			content, ok := executeTemplate(i, templates, variables.FillString(action.Text))
			if !ok {
				return nil
			}

			_, err = s.ChannelMessageSend(dmChannel.ID, content)
			if err != nil {
				i.Respond(&discordgo.InteractionResponseData{
					Content: "Failed to send DM",
					Flags:   discordgo.MessageFlagsEphemeral,
				})
				return nil
			}

			i.Respond(&discordgo.InteractionResponseData{
				Content: "You have received a DM!",
				Flags:   discordgo.MessageFlagsEphemeral,
			})
		case actions.ActionTypeSavedMessageDM:
			msg, err := m.pg.Q.GetSavedMessageForGuild(context.TODO(), pgmodel.GetSavedMessageForGuildParams{
				GuildID: sql.NullString{Valid: true, String: interaction.GuildID},
				ID:      action.TargetID,
			})
			if err != nil {
				return err
			}

			data := &actions.MessageWithActions{}
			err = json.Unmarshal(msg.Data, data)
			if err != nil {
				return err
			}

			variables.FillMessage(data)
			if !executeTemplateMessage(i, templates, data) {
				return nil
			}

			dmChannel, err := s.UserChannelCreate(interaction.Member.User.ID)
			if err != nil {
				i.Respond(&discordgo.InteractionResponseData{
					Content: "Failed to send DM",
					Flags:   discordgo.MessageFlagsEphemeral,
				})
				return nil
			}

			_, err = s.ChannelMessageSendComplex(dmChannel.ID, &discordgo.MessageSend{
				Content: data.Content,
				Embeds:  data.Embeds,
			})
			if err != nil {
				i.Respond(&discordgo.InteractionResponseData{
					Content: "Failed to send DM",
					Flags:   discordgo.MessageFlagsEphemeral,
				})
				return nil
			}

			i.Respond(&discordgo.InteractionResponseData{
				Content: "You have received a DM!",
				Flags:   discordgo.MessageFlagsEphemeral,
			})
		case actions.ActionTypeTextEdit:
			content, ok := executeTemplate(i, templates, variables.FillString(action.Text))
			if !ok {
				return nil
			}

			i.Respond(&discordgo.InteractionResponseData{
				Content: content,
			}, discordgo.InteractionResponseUpdateMessage)
		case actions.ActionTypeSavedMessageEdit:
			if interaction.Type != discordgo.InteractionMessageComponent {
				continue
			}

			msg, err := m.pg.Q.GetSavedMessageForGuild(context.TODO(), pgmodel.GetSavedMessageForGuildParams{
				GuildID: sql.NullString{Valid: true, String: interaction.GuildID},
				ID:      action.TargetID,
			})
			if err != nil {
				return err
			}

			data := &actions.MessageWithActions{}
			err = json.Unmarshal(msg.Data, data)
			if err != nil {
				return err
			}

			variables.FillMessage(data)
			if !executeTemplateMessage(i, templates, data) {
				return nil
			}

			var components []discordgo.MessageComponent
			if !legacyPermissions {
				components, err = m.parser.ParseMessageComponents(data.Components, features.ComponentTypes)
				if err != nil {
					return fmt.Errorf("Invalid actions: %w", err)
				}
			}

			i.Respond(&discordgo.InteractionResponseData{
				Content:    data.Content,
				Embeds:     data.Embeds,
				Components: components,
			}, discordgo.InteractionResponseUpdateMessage)

			if !legacyPermissions {
				ephemeral := interaction.Message.Flags&discordgo.MessageFlagsEphemeral != 0
				err = m.parser.CreateActionsForMessage(context.TODO(), data.Actions, derivedPerms, interaction.Message.ID, ephemeral)
				if err != nil {
					log.Error().Err(err).Msg("failed to create actions for message")
					return err
				}
			}
		case actions.ActionTypePermissionCheck:
			perms, _ := strconv.ParseInt(action.Permissions, 10, 64)

			if interaction.Member.Permissions&perms != perms {
				responseText := "You don't have the required permissions to use this component or command."
				if action.DisableDefaultResponse {
					responseText = action.Text
				}

				i.Respond(&discordgo.InteractionResponseData{
					Content: responseText,
					Flags:   discordgo.MessageFlagsEphemeral,
				})
				return nil
			}

			responseText := "You don't have the required roles to use this component or command."
			if action.DisableDefaultResponse {
				responseText = action.Text
			}

			if len(action.RoleIDs) != 0 {
				for _, roleID := range action.RoleIDs {
					if !slices.Contains(interaction.Member.Roles, roleID) {
						i.Respond(&discordgo.InteractionResponseData{
							Content: responseText,
							Flags:   discordgo.MessageFlagsEphemeral,
						})
						return nil
					}
				}
			}
		}
	}

	if !i.HasResponded() {
		if interaction.Type == discordgo.InteractionMessageComponent {
			i.Respond(nil, discordgo.InteractionResponseDeferredMessageUpdate)
		} else {
			i.Respond(&discordgo.InteractionResponseData{
				Content: "No response",
				Flags:   discordgo.MessageFlagsEphemeral,
			})
		}
	}

	return nil
}

func executeTemplate(i Interaction, templates *template.TemplateContext, text string) (string, bool) {
	res, err := templates.ParseAndExecute(text)
	if err != nil {
		log.Error().Err(err).Msg("Failed to execute template")
		i.Respond(&discordgo.InteractionResponseData{
			Content: fmt.Sprintf("Failed to execute template variables:\n```%s```", err.Error()),
			Flags:   discordgo.MessageFlagsEphemeral,
		})
		return "", false
	}
	return res, true
}

func executeTemplateMessage(i Interaction, templates *template.TemplateContext, m *actions.MessageWithActions) bool {
	if err := templates.ParseAndExecuteMessage(m); err != nil {
		log.Error().Err(err).Msg("Failed to execute template")
		i.Respond(&discordgo.InteractionResponseData{
			Content: fmt.Sprintf("Failed to execute template variables:\n```%s```", err.Error()),
			Flags:   discordgo.MessageFlagsEphemeral,
		})
		return false
	}

	return true
}

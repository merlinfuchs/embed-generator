package handler

import (
	"context"
	"database/sql"
	"encoding/json"
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

func (m *ActionHandler) HandleActionInteraction(rest rest.Rest, i Interaction) error {
	interaction := i.Interaction()

	var rawActions []byte
	var rawDerivedPerms pqtype.NullRawMessage
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

		col, err := m.pg.Q.GetMessageActionSet(context.TODO(), pgmodel.GetMessageActionSetParams{
			MessageID: compInteraction.Message.ID.String(),
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
	} else if interaction.Type() == discord.InteractionTypeApplicationCommand {
		appCommandInteraction := interaction.(discord.ApplicationCommandInteraction)
		slashData := appCommandInteraction.SlashCommandInteractionData()
		fullName := slashData.CommandName()
		for _, opt := range slashData.All() {
			if opt.Type == discord.ApplicationCommandOptionTypeSubCommand {
				fullName += " " + opt.Name
			} else if opt.Type == discord.ApplicationCommandOptionTypeSubCommandGroup {
				fullName += " " + opt.Name
				// TODO: Handle subcommand group options properly
			}
		}

		col, err := m.pg.Q.GetCustomCommandByName(context.TODO(), pgmodel.GetCustomCommandByNameParams{
			Name:    fullName,
			GuildID: interaction.GuildID().String(),
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
		template.NewKVProvider(*interaction.GuildID(), m.pg, features.MaxKVKeys),
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
					log.Error().Err(err).Msg("Failed to parse role ID")
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
					log.Error().Err(err).Msg("Failed to parse role ID")
					return err
				}

				if hasRole {
					err = rest.RemoveMemberRole(*interaction.GuildID(), member.User.ID, roleID)
					if err == nil {
						if !action.DisableDefaultResponse {
							i.Respond(discord.MessageCreate{
								Content: fmt.Sprintf("Removed role <@&%s>", action.TargetID),
								Flags:   discord.MessageFlagEphemeral,
							})
						}
					}
				} else {
					err = rest.AddMemberRole(*interaction.GuildID(), member.User.ID, roleID)
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
				log.Error().Err(err).Msg("Failed to toggle role")
				i.Respond(discord.MessageCreate{
					Content: roleErrorMessage,
					Flags:   discord.MessageFlagEphemeral,
				})
			}
		case actions.ActionTypeAddRole:
			if !legacyPermissions {
				roleID, err := snowflake.Parse(action.TargetID)
				if err != nil {
					log.Error().Err(err).Msg("Failed to parse role ID")
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
					log.Error().Err(err).Msg("Failed to parse role ID")
					return err
				}

				err = rest.AddMemberRole(*interaction.GuildID(), member.User.ID, roleID)
				if err == nil {
					if !action.DisableDefaultResponse {
						i.Respond(discord.MessageCreate{
							Content: fmt.Sprintf("Added role <@&%s>", action.TargetID),
							Flags:   discord.MessageFlagEphemeral,
						})
					}
				} else {
					log.Error().Err(err).Msg("Failed to add role")
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
					log.Error().Err(err).Msg("Failed to parse role ID")
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
					log.Error().Err(err).Msg("Failed to parse role ID")
					return err
				}

				err = rest.RemoveMemberRole(*interaction.GuildID(), member.User.ID, roleID)
				if err == nil {
					if !action.DisableDefaultResponse {
						i.Respond(discord.MessageCreate{
							Content: fmt.Sprintf("Removed role <@&%s>", action.TargetID),
							Flags:   discord.MessageFlagEphemeral,
						})
					}
				} else {
					log.Error().Err(err).Msg("Failed to remove role")
					i.Respond(discord.MessageCreate{
						Content: roleErrorMessage,
						Flags:   discord.MessageFlagEphemeral,
					})
				}
			}
		case actions.ActionTypeSavedMessageResponse:
			msg, err := m.pg.Q.GetSavedMessageForGuild(context.TODO(), pgmodel.GetSavedMessageForGuildParams{
				GuildID: sql.NullString{Valid: true, String: interaction.GuildID().String()},
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

			// TODO: Fix variables system - variables.FillMessage(data)
			if !executeTemplateMessage(i, templates, data) {
				return nil
			}

			var flags discord.MessageFlags
			if !action.Public {
				flags = discord.MessageFlagEphemeral
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
					Flags: flags,
				})
			}

			newMsg := i.Respond(discord.MessageCreate{
				Content:    data.Content,
				Embeds:     data.Embeds,
				Components: components,
				Flags:      flags,
				AllowedMentions: &discord.AllowedMentions{
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
			// TODO: Fix DM functionality - need to implement with disgo
			i.Respond(discord.MessageCreate{
				Content: "DM functionality not yet implemented with disgo",
				Flags:   discord.MessageFlagEphemeral,
			})
		case actions.ActionTypeSavedMessageDM:
			// TODO: Fix DM functionality - need to implement with disgo
			i.Respond(discord.MessageCreate{
				Content: "DM functionality not yet implemented with disgo",
				Flags:   discord.MessageFlagEphemeral,
			})
		case actions.ActionTypeTextEdit:
			content, ok := executeTemplate(i, templates, action.Text) // TODO: Fix variables system
			if !ok {
				return nil
			}

			i.Respond(discord.MessageCreate{
				Content: content,
			})
		case actions.ActionTypeSavedMessageEdit:
			if interaction.Type() != discord.InteractionTypeComponent {
				continue
			}

			msg, err := m.pg.Q.GetSavedMessageForGuild(context.TODO(), pgmodel.GetSavedMessageForGuildParams{
				GuildID: sql.NullString{Valid: true, String: interaction.GuildID().String()},
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

			i.Respond(discord.MessageCreate{
				Content:    data.Content,
				Embeds:     data.Embeds,
				Components: components,
			})

			if !legacyPermissions {
				if compInteraction, ok := interaction.(discord.ComponentInteraction); ok {
					ephemeral := compInteraction.Message.Flags&discord.MessageFlagEphemeral != 0
					err = m.parser.CreateActionsForMessage(context.TODO(), data.Actions, derivedPerms, compInteraction.Message.ID, ephemeral)
					if err != nil {
						log.Error().Err(err).Msg("failed to create actions for message")
						return err
					}
				}
			}
		case actions.ActionTypePermissionCheck:
			perms, _ := strconv.ParseInt(action.Permissions, 10, 64)

			if member := interaction.Member(); member != nil && member.Permissions&discord.Permissions(perms) != discord.Permissions(perms) {
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
				if member := interaction.Member(); member != nil {
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
	}

	if !i.HasResponded() {
		if interaction.Type() == discord.InteractionTypeComponent {
			i.Respond(discord.MessageCreate{})
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
		log.Error().Err(err).Msg("Failed to execute template")
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
		log.Error().Err(err).Msg("Failed to execute template")
		i.Respond(discord.MessageCreate{
			Content: fmt.Sprintf("Failed to execute template variables:\n```%s```", err.Error()),
			Flags:   discord.MessageFlagEphemeral,
		})
		return false
	}

	return true
}

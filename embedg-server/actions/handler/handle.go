package handler

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
)

type ActionHandler struct {
	pg *postgres.PostgresStore
}

func New(pg *postgres.PostgresStore) *ActionHandler {
	return &ActionHandler{
		pg: pg,
	}
}

func (m *ActionHandler) HandleActionInteraction(s *discordgo.Session, i Interaction, data discordgo.MessageComponentInteractionData) error {
	actionSetID := data.CustomID[7:]

	if strings.HasPrefix(actionSetID, "options:") {
		actionSetID = data.Values[0][7:]
	}

	interaction := i.Interaction()
	col, err := m.pg.Q.GetMessageActionSet(context.TODO(), postgres.GetMessageActionSetParams{
		MessageID: interaction.Message.ID,
		SetID:     actionSetID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return nil
		}

		log.Error().Err(err).Msg("Failed to get action set")
		return err
	}

	actionSet := actions.ActionSet{}
	err = json.Unmarshal(col.Actions, &actionSet)
	if err != nil {
		log.Error().Err(err).Msg("Failed to unmarshal action set")
		return err
	}

	for _, action := range actionSet.Actions {
		switch action.Type {
		case actions.ActionTypeTextResponse:
			var flags discordgo.MessageFlags
			if !action.Public {
				flags = discordgo.MessageFlagsEphemeral
			}

			i.Respond(&discordgo.InteractionResponseData{
				Content: action.Text,
				Flags:   flags,
			})
		case actions.ActionTypeToggleRole:
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
					i.Respond(&discordgo.InteractionResponseData{
						Content: fmt.Sprintf("Removed role <@&%s>", action.TargetID),
						Flags:   discordgo.MessageFlagsEphemeral,
					})
				}
			} else {
				err = s.GuildMemberRoleAdd(interaction.GuildID, interaction.Member.User.ID, action.TargetID)
				if err == nil {
					i.Respond(&discordgo.InteractionResponseData{
						Content: fmt.Sprintf("Added role <@&%s>", action.TargetID),
						Flags:   discordgo.MessageFlagsEphemeral,
					})
				}
			}
			if err != nil {
				log.Error().Err(err).Msg("Failed to toggle role")
				i.Respond(&discordgo.InteractionResponseData{
					Content: "Failed to toggle role",
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			}
		case actions.ActionTypeAddRole:
			err := s.GuildMemberRoleAdd(interaction.GuildID, interaction.Member.User.ID, action.TargetID)
			if err == nil {
				i.Respond(&discordgo.InteractionResponseData{
					Content: fmt.Sprintf("Added role <@&%s>", action.TargetID),
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			} else {
				log.Error().Err(err).Msg("Failed to add role")
				i.Respond(&discordgo.InteractionResponseData{
					Content: "Failed to add role",
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			}
		case actions.ActionTypeRemoveRole:
			err := s.GuildMemberRoleRemove(interaction.GuildID, interaction.Member.User.ID, action.TargetID)
			if err == nil {
				i.Respond(&discordgo.InteractionResponseData{
					Content: fmt.Sprintf("Removed role <@&%s>", action.TargetID),
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			} else {
				log.Error().Err(err).Msg("Failed to remove role")
				i.Respond(&discordgo.InteractionResponseData{
					Content: "Failed to remove role",
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			}
		case actions.ActionTypeSavedMessageResponse:
			msg, err := m.pg.Q.GetSavedMessageForGuild(context.TODO(), postgres.GetSavedMessageForGuildParams{
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

			var flags discordgo.MessageFlags
			if !action.Public {
				flags = discordgo.MessageFlagsEphemeral
			}

			// TODO: components
			i.Respond(&discordgo.InteractionResponseData{
				Content: data.Content,
				Embeds:  data.Embeds,
				Flags:   flags,
			})
		case actions.ActionTypeTextDM:
			dmChannel, err := s.UserChannelCreate(interaction.Member.User.ID)
			if err != nil {
				i.Respond(&discordgo.InteractionResponseData{
					Content: "Failed to send DM",
					Flags:   discordgo.MessageFlagsEphemeral,
				})
				return nil
			}
			_, err = s.ChannelMessageSend(dmChannel.ID, action.Text)
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
			break
		case actions.ActionTypeSavedMessageDM:
			msg, err := m.pg.Q.GetSavedMessageForGuild(context.TODO(), postgres.GetSavedMessageForGuildParams{
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

			dmChannel, err := s.UserChannelCreate(interaction.Member.User.ID)
			if err != nil {
				i.Respond(&discordgo.InteractionResponseData{
					Content: "Failed to send DM",
					Flags:   discordgo.MessageFlagsEphemeral,
				})
				return nil
			}

			// TODO: components
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
			break
		case actions.ActionTypeTextEdit:
			i.Respond(&discordgo.InteractionResponseData{
				Content: action.Text,
			}, discordgo.InteractionResponseUpdateMessage)
			break
		case actions.ActionTypeSavedMessageEdit:
			msg, err := m.pg.Q.GetSavedMessageForGuild(context.TODO(), postgres.GetSavedMessageForGuildParams{
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

			// TODO: components
			i.Respond(&discordgo.InteractionResponseData{
				Content: data.Content,
				Embeds:  data.Embeds,
			}, discordgo.InteractionResponseUpdateMessage)
		}
	}

	if !i.HasResponded() {
		i.Respond(&discordgo.InteractionResponseData{
			Content: "No response",
			Flags:   discordgo.MessageFlagsEphemeral,
		})
	}

	return nil
}

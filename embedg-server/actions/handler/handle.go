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

func (m *ActionHandler) HandleActionInteraction(s *discordgo.Session, i *discordgo.InteractionCreate, data discordgo.MessageComponentInteractionData) error {
	actionSetID := data.CustomID[7:]

	if strings.HasPrefix(actionSetID, "options:") {
		actionSetID = data.Values[0][7:]
	}

	col, err := m.pg.Q.GetMessageActionSet(context.TODO(), postgres.GetMessageActionSetParams{
		MessageID: i.Message.ID,
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

	responded := false
	respond := func(data *discordgo.InteractionResponseData) {
		var err error

		if !responded {
			err = s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
				Type: discordgo.InteractionResponseChannelMessageWithSource,
				Data: data,
			})
		} else {
			_, err = s.FollowupMessageCreate(i.Interaction, false, &discordgo.WebhookParams{
				Content:    data.Content,
				Embeds:     data.Embeds,
				Components: data.Components,
				Files:      data.Files,
				Flags:      data.Flags,
			})
		}

		if err != nil {
			log.Error().Err(err).Msg("Failed to respond to interaction")
		} else {
			responded = true
		}
	}

	for _, action := range actionSet.Actions {
		switch action.Type {
		case actions.ActionTypeTextResponse:
			respond(&discordgo.InteractionResponseData{
				Content: action.Text,
				Flags:   discordgo.MessageFlagsEphemeral,
			})
		case actions.ActionTypeToggleRole:
			hasRole := false
			for _, roleID := range i.Member.Roles {
				if roleID == action.TargetID {
					hasRole = true
				}
			}

			var err error
			if hasRole {
				err = s.GuildMemberRoleRemove(i.GuildID, i.Member.User.ID, action.TargetID)
				if err == nil {
					respond(&discordgo.InteractionResponseData{
						Content: fmt.Sprintf("Removed role <@&%s>", action.TargetID),
						Flags:   discordgo.MessageFlagsEphemeral,
					})
				}
			} else {
				err = s.GuildMemberRoleAdd(i.GuildID, i.Member.User.ID, action.TargetID)
				if err == nil {
					respond(&discordgo.InteractionResponseData{
						Content: fmt.Sprintf("Added role <@&%s>", action.TargetID),
						Flags:   discordgo.MessageFlagsEphemeral,
					})
				}
			}
			if err != nil {
				log.Error().Err(err).Msg("Failed to toggle role")
				respond(&discordgo.InteractionResponseData{
					Content: fmt.Sprintf("Failed to toggle role"),
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			}
		case actions.ActionTypeAddRole:
			err := s.GuildMemberRoleAdd(i.GuildID, i.Member.User.ID, action.TargetID)
			if err == nil {
				respond(&discordgo.InteractionResponseData{
					Content: fmt.Sprintf("Added role <@&%s>", action.TargetID),
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			} else {
				log.Error().Err(err).Msg("Failed to add role")
				respond(&discordgo.InteractionResponseData{
					Content: fmt.Sprintf("Failed to add role"),
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			}
		case actions.ActionTypeRemoveRole:
			err := s.GuildMemberRoleRemove(i.GuildID, i.Member.User.ID, action.TargetID)
			if err == nil {
				respond(&discordgo.InteractionResponseData{
					Content: fmt.Sprintf("Removed role <@&%s>", action.TargetID),
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			} else {
				log.Error().Err(err).Msg("Failed to remove role")
				respond(&discordgo.InteractionResponseData{
					Content: fmt.Sprintf("Failed to remove role"),
					Flags:   discordgo.MessageFlagsEphemeral,
				})
			}
		case actions.ActionTypeSavedMessageResponse:
			msg, err := m.pg.Q.GetSavedMessageForGuild(context.TODO(), postgres.GetSavedMessageForGuildParams{
				GuildID: sql.NullString{Valid: true, String: i.GuildID},
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
			respond(&discordgo.InteractionResponseData{
				Content: data.Content,
				Embeds:  data.Embeds,
				Flags:   discordgo.MessageFlagsEphemeral,
			})
		}
	}

	if !responded {
		respond(&discordgo.InteractionResponseData{
			Content: "No response",
			Flags:   discordgo.MessageFlagsEphemeral,
		})
	}

	return nil
}

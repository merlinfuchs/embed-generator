package handler

import (
	"context"
	"encoding/json"
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

	if strings.HasPrefix(actionSetID, "action:options:") {
		actionSetID = data.Values[0][7:]
	}

	col, err := m.pg.Q.GetMessageActionSet(context.TODO(), postgres.GetMessageActionSetParams{
		MessageID: i.Message.ID,
		SetID:     actionSetID,
	})
	if err != nil {
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
	for _, action := range actionSet.Actions {
		switch action.Type {
		case actions.ActionTypeTextResponse:
			var err error
			if !responded {
				err = s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
					Type: discordgo.InteractionResponseChannelMessageWithSource,
					Data: &discordgo.InteractionResponseData{
						Content: action.Text,
						Flags:   discordgo.MessageFlagsEphemeral,
					},
				})
			} else {
				_, err = s.FollowupMessageCreate(i.Interaction, false, &discordgo.WebhookParams{
					Content: action.Text,
				})
			}
			if err != nil {
				log.Error().Err(err).Msg("Failed to respond to interaction")
			} else {
				responded = true
			}
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
			} else {
				err = s.GuildMemberRoleAdd(i.GuildID, i.Member.User.ID, action.TargetID)
			}
			if err != nil {
				log.Error().Err(err).Msg("Failed to toggle role")
			}
		}
	}

	if !responded {
		err = s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "No response",
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to respond to interaction")
		}
	}

	return nil
}

package handler

import (
	"context"
	"encoding/json"

	"github.com/bwmarrin/discordgo"
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
		if action.Type == actions.ActionTypeTextResponse {
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
		}
	}

	if !responded {
		err = s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "Hello World! " + data.CustomID,
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to respond to interaction")
		}
	}

	return nil
}

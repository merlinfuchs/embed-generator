package bot

import (
	"context"
	"database/sql"
	"strings"

	"github.com/merlinfuchs/discordgo"
	"github.com/rs/zerolog/log"
)

func onReady(s *discordgo.Session, r *discordgo.Ready) {
	log.Info().Msgf("Shard %d is ready", s.ShardID)
}

func onConnect(s *discordgo.Session, c *discordgo.Connect) {
	log.Info().Msgf("Shard %d connected", s.ShardID)
}

func onDisconnect(s *discordgo.Session, d *discordgo.Disconnect) {
	log.Info().Msgf("Shard %d disconnected", s.ShardID)
}

func onResumed(s *discordgo.Session, r *discordgo.Resumed) {
	log.Info().Msgf("Shard %d resumed", s.ShardID)
}

func (b *Bot) onMessageDelete(s *discordgo.Session, msg *discordgo.MessageDelete) {
	err := b.pg.Q.DeleteMessageActionSetsForMessage(context.TODO(), msg.ID)
	if err != nil && err != sql.ErrNoRows {
		log.Error().Err(err).Msg("Failed to delete action set for deleted message")
	}
}

func (b *Bot) onInteractionCreate(s *discordgo.Session, i *discordgo.InteractionCreate) {
	if i.Type == discordgo.InteractionMessageComponent {
		data := i.MessageComponentData()
		if strings.HasPrefix(data.CustomID, "action:") {
			err := b.actionHandler.HandleActionInteraction(s, i, data)
			if err != nil {
				log.Error().Err(err).Msg("Failed to handle action interaction")
			}
		} else {
			err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
				Type: discordgo.InteractionResponseChannelMessageWithSource,
				Data: &discordgo.InteractionResponseData{
					Content: "This component is not supported anymore. Please update the message at <https://message.style> to fix this.",
					Flags:   discordgo.MessageFlagsEphemeral,
				},
			})
			if err != nil {
				log.Error().Err(err).Msg("Failed to handle interaction for legacy component")
			}
		}
	} else if i.Type == discordgo.InteractionApplicationCommand {
		data := i.ApplicationCommandData()
		err := b.handleCommandInteraction(s, i.Interaction, data)
		if err != nil {
			log.Error().Err(err).Msg("Failed to handle command interaction")
		}
	}
}

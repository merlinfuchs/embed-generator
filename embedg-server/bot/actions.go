package bot

import (
	"strings"

	"github.com/merlinfuchs/discordgo"
	"github.com/rs/zerolog/log"
)

func (b *Bot) onInteractionCreate(s *discordgo.Session, i *discordgo.InteractionCreate) {
	if i.Type == discordgo.InteractionMessageComponent {
		data := i.MessageComponentData()
		if strings.HasPrefix(data.CustomID, "action:") {
			err := b.actionHandler.HandleActionInteraction(s, i, data)
			if err != nil {
				log.Error().Err(err).Msg("Failed to handle action interaction")
			}
		}
	}
}

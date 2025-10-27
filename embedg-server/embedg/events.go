package embedg

import (
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/rs/zerolog/log"
)

func (g *EmbedGenerator) HandleInteraction(interaction handler.Interaction) {
	switch i := interaction.Interaction().(type) {
	case discord.ComponentInteraction:
		if strings.HasPrefix(i.Data.CustomID(), "action:") {
			err := g.ActionHandler().HandleActionInteraction(g.Rest(), interaction)
			if err != nil {
				log.Error().Err(err).Msg("Failed to handle action interaction")
			}
		}
	}
}

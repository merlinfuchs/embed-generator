package bot

import (
	"context"
	"database/sql"
	"encoding/json"
	"strings"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/rs/zerolog/log"
)

func (b *Bot) onReady(s *discordgo.Session, r *discordgo.Ready) {
	for _, g := range r.Guilds {
		b.State.AddGuilds(g.ID)
	}
	log.Info().Msgf("Shard %d is ready", s.ShardID)
}

func (b *Bot) onGuildCreate(s *discordgo.Session, g *discordgo.GuildCreate) {
	b.State.AddGuilds(g.ID)
}

func (b *Bot) onGuildDelete(s *discordgo.Session, g *discordgo.GuildDelete) {
	b.State.RemoveGuilds(g.ID)
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
			gi := &handler.GatewayInteraction{
				Inner:   i.Interaction,
				Session: s,
			}

			err := b.ActionHandler.HandleActionInteraction(s, gi)
			if err != nil {
				log.Error().Err(err).Msg("Failed to handle action interaction")
			}
		} else {
			err := b.handleComponentInteraction(s, i.Interaction, data)
			if err != nil {
				log.Error().Err(err).Msg("Failed to handle component interaction")
			}
		}
	} else if i.Type == discordgo.InteractionModalSubmit {
		data := i.ModalSubmitData()
		err := b.handleModalInteraction(s, i.Interaction, data)
		if err != nil {
			log.Error().Err(err).Msg("Failed to handle modal interaction")
		}
	} else if i.Type == discordgo.InteractionApplicationCommand {
		data := i.ApplicationCommandData()
		err := b.handleCommandInteraction(s, i.Interaction, data)
		if err != nil {
			log.Error().Err(err).Msg("Failed to handle command interaction")
		}
	}
}

func (b *Bot) onEvent(s *discordgo.Session, e *discordgo.Event) {
	if e.Type == "ENTITLEMENT_CREATE" || e.Type == "ENTITLEMENT_UPDATE" || e.Type == "ENTITLEMENT_DELETE" {
		entitlement := &Entitlement{}
		err := json.Unmarshal(e.RawData, entitlement)
		if err != nil {
			log.Error().Err(err).Msg("Failed to unmarshal entitlement")
			return
		}

		b.HandleEntitlementEvent(entitlement)
	}
}

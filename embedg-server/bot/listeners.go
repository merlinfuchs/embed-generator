package bot

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/rs/zerolog/log"
)

func onReady(s *discordgo.Session, r *discordgo.Ready) {
	log.Info().
		Str("client_id", r.User.ID).
		Str("username", r.User.Username).
		Int("shard_id", s.ShardID).
		Msg("Shard is ready")
}

func onConnect(s *discordgo.Session, c *discordgo.Connect) {
	log.Info().
		Int("shard_id", s.ShardID).
		Msg("Shard connected")
}

func onDisconnect(s *discordgo.Session, d *discordgo.Disconnect) {
	log.Info().
		Int("shard_id", s.ShardID).
		Msg("Shard disconnected")
}

func onResumed(s *discordgo.Session, r *discordgo.Resumed) {
	log.Info().
		Int("shard_id", s.ShardID).
		Msg("Shard resumed")
}

func (b *Bot) onMessageDelete(_ *discordgo.Session, msg *discordgo.MessageDelete) {
	err := b.pg.Q.DeleteMessageActionSetsForMessage(context.TODO(), msg.ID)
	if err != nil && err != sql.ErrNoRows {
		log.Error().Err(err).Msg("Failed to delete action set for deleted message")
	}
}

func (b *Bot) onGuildMemberUpdate(_ *discordgo.Session, g *discordgo.GuildMemberUpdate) {
	b.Rest.InvalidateMemberCache(g.GuildID, g.User.ID)
}

func (b *Bot) onGuildMemberRemove(_ *discordgo.Session, g *discordgo.GuildMemberRemove) {
	b.Rest.InvalidateMemberCache(g.GuildID, g.User.ID)
}

func (b *Bot) onInteractionCreate(_ *discordgo.Session, i *discordgo.InteractionCreate) {
	gi := &handler.GatewayInteraction{
		Session: b.Session,
		Inner:   i.Interaction,
	}

	b.HandlerInteraction(b.Session, gi, i.Interaction.Data)
}

func (b *Bot) onRawEvent(_ *discordgo.Session, e *discordgo.Event) {
	// TODO: discordgo.Event is no longer dispatched when using Stateway, so we need to handle entitlements differently.
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

func (b *Bot) onInterface(_ *discordgo.Session, i interface{}) {
	err := b.State.OnInterface(b.Session, i)
	if err != nil {
		log.Error().
			Err(err).
			Str("type", fmt.Sprintf("%T", i)).
			Msg("Failed to handle interface for state")
	}
}

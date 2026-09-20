package server

import (
	"context"
	"log/slog"
	"strings"
	"time"

	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"gopkg.in/guregu/null.v4"
)

type EventHandlerConfig struct {
	DiscordLink string
}

type EventHandler struct {
	config         EventHandlerConfig
	embedg         *embedg.EmbedGenerator
	rest           rest.Rest
	caches         cache.Caches
	actionSetStore store.MessageActionSetStore
	guildStore     store.GuildStore
	actionHandler  *handler.ActionHandler
}

func NewEventHandler(
	config EventHandlerConfig,
	embedg *embedg.EmbedGenerator,
	rest rest.Rest,
	caches cache.Caches,
	actionSetStore store.MessageActionSetStore,
	guildStore store.GuildStore,
	actionHandler *handler.ActionHandler,
) *EventHandler {
	return &EventHandler{
		config:         config,
		embedg:         embedg,
		rest:           rest,
		caches:         caches,
		actionSetStore: actionSetStore,
		guildStore:     guildStore,
		actionHandler:  actionHandler,
	}
}

func (g *EventHandler) OnEvent(event bot.Event) {
	switch e := event.(type) {
	case *events.MessageDelete:
		g.onMessageDelete(e)
	case *events.GuildReady:
		g.upsertGuild(e.Guild.Guild)
	case *events.GuildJoin:
		g.upsertGuild(e.Guild.Guild)
	case *events.GuildUpdate:
		g.upsertGuild(e.Guild)
	case *events.GuildLeave:
		g.onGuildLeave(e)
	case *events.InteractionCreate:
		componentInteraction, ok := e.Interaction.(discord.ComponentInteraction)
		if ok {
			g.onComponentInteractionCreate(&events.ComponentInteractionCreate{
				GenericEvent:         e.GenericEvent,
				ComponentInteraction: componentInteraction,
				Respond:              e.Respond,
			})
		}
	}
}

func (g *EventHandler) upsertGuild(guild discord.Guild) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	now := time.Now().UTC()

	err := g.guildStore.UpsertGuild(ctx, model.Guild{
		ID:        guild.ID,
		Name:      guild.Name,
		Icon:      null.StringFromPtr(guild.Icon),
		OwnerID:   guild.OwnerID,
		JoinedAt:  now,
		UpdatedAt: now,
	})
	if err != nil {
		slog.Error(
			"Failed to upsert guild",
			slog.String("guild_id", guild.ID.String()),
			slog.Any("error", err),
		)
	}
}

func (g *EventHandler) onGuildLeave(event *events.GuildLeave) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// event.Guild comes from the disgo cache which we don't populate, so we use the event's guild id.
	err := g.guildStore.MarkGuildLeft(ctx, event.GuildID, time.Now().UTC())
	if err != nil {
		slog.Error(
			"Failed to mark guild as left",
			slog.String("guild_id", event.GuildID.String()),
			slog.Any("error", err),
		)
	}
}

func (g *EventHandler) onMessageDelete(event *events.MessageDelete) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := g.actionSetStore.DeleteMessageActionSetsForMessage(ctx, event.MessageID)
	if err != nil {
		slog.Error(
			"Failed to delete message action sets",
			slog.String("message_id", event.MessageID.String()),
			slog.Any("error", err),
		)
	}
}

func (g *EventHandler) onComponentInteractionCreate(event *events.ComponentInteractionCreate) {
	isAction := strings.HasPrefix(event.Data.CustomID(), "action:")
	if isAction {
		gi := &handler.GenericInteraction{
			Rest:        g.rest,
			Inner:       event.ComponentInteraction,
			RespondFunc: event.Respond,
		}

		err := g.actionHandler.HandleActionInteraction(g.rest, gi)
		if err != nil {
			slog.Error("Failed to handle action interaction", slog.Any("error", err))
		}
	}
}

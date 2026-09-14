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
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
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
	actionHandler  *handler.ActionHandler
}

func NewEventHandler(
	config EventHandlerConfig,
	embedg *embedg.EmbedGenerator,
	rest rest.Rest,
	caches cache.Caches,
	actionSetStore store.MessageActionSetStore,
	actionHandler *handler.ActionHandler,
) *EventHandler {
	return &EventHandler{
		config:         config,
		embedg:         embedg,
		rest:           rest,
		caches:         caches,
		actionSetStore: actionSetStore,
		actionHandler:  actionHandler,
	}
}

func (g *EventHandler) OnEvent(event bot.Event) {
	switch e := event.(type) {
	case *events.MessageDelete:
		g.onMessageDelete(e)
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

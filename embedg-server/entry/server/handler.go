package server

import (
	"context"
	"log/slog"
	"strings"
	"time"

	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-server/embedg"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

type EventHandlerConfig struct {
	DiscordLink string
}

type EventHandler struct {
	config         EventHandlerConfig
	embedg         *embedg.EmbedGenerator
	rest           rest.Rest
	actionSetStore store.MessageActionSetStore
	actionHandler  *handler.ActionHandler
}

func NewEventHandler(
	config EventHandlerConfig,
	embedg *embedg.EmbedGenerator,
	rest rest.Rest,
	actionSetStore store.MessageActionSetStore,
	actionHandler *handler.ActionHandler,
) *EventHandler {
	return &EventHandler{
		config:         config,
		embedg:         embedg,
		rest:           rest,
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
		i := handler.NewInteraction(event.ComponentInteraction, g.rest, func(resp discord.InteractionResponse) error {
			return event.Respond(resp.Type, resp.Data)
		})

		err := g.actionHandler.HandleActionInteraction(g.rest, i)
		if err != nil {
			slog.Error("Failed to handle action interaction", slog.Any("error", err))
		}
	}
}

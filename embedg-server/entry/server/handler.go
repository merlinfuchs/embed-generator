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
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
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
		switch interaction := e.Interaction.(type) {
		case discord.ComponentInteraction:
			g.onComponentInteractionCreate(&events.ComponentInteractionCreate{
				GenericEvent:         e.GenericEvent,
				ComponentInteraction: interaction,
				Respond:              e.Respond,
			})
		case discord.ModalSubmitInteraction:
			g.onModalSubmitInteractionCreate(interaction, e.Respond)
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
		i := handler.NewInteraction(event.ComponentInteraction, g.rest, event.Respond)

		err := g.actionHandler.HandleActionInteraction(g.rest, i)
		if err != nil {
			slog.Error("Failed to handle action interaction", slog.Any("error", err))
		}
	}
}

// onModalSubmitInteractionCreate runs the actions of a submitted form. The modals of the /embed
// command have other custom IDs and are handled by the command handler.
func (g *EventHandler) onModalSubmitInteractionCreate(interaction discord.ModalSubmitInteraction, respond events.InteractionResponderFunc) {
	if !strings.HasPrefix(interaction.Data.CustomID, actions.FormCustomIDPrefix) {
		return
	}

	i := handler.NewInteraction(interaction, g.rest, respond)

	err := g.actionHandler.HandleActionInteraction(g.rest, i)
	if err != nil {
		slog.Error("Failed to handle action interaction", slog.Any("error", err))
	}
}

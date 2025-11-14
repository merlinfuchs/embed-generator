package embedg

import (
	"context"
	"log/slog"
	"time"

	"github.com/disgoorg/disgo/events"
)

func (g *EmbedGenerator) onMessageDelete(event *events.MessageDelete) {
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

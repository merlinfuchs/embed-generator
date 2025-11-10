package stateway

import (
	"context"
	"fmt"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/stateway/stateway-lib/broker"
	"github.com/merlinfuchs/stateway/stateway-lib/event"
	"github.com/rs/zerolog/log"
)

type GatewayListener struct {
	session    *discordgo.Session
	gatewayIDs []int
}

func (l *GatewayListener) BalanceKey() string {
	balanceKey := "embedg_"
	if len(l.gatewayIDs) > 0 {
		for _, gatewayID := range l.gatewayIDs {
			balanceKey += fmt.Sprintf("%d", gatewayID)
		}
	} else {
		balanceKey += "*"
	}
	return balanceKey
}

func (l *GatewayListener) EventFilter() broker.EventFilter {
	return broker.EventFilter{
		GatewayIDs: l.gatewayIDs,
		EventTypes: []string{
			"ready",
			"resumed",
			"guild.>",
			"channel.>",
			"thread.>",
			"entitlement.>",
			"webhooks.>",
			"interaction.>",
			"message.delete",
		},
	}
}

func (l *GatewayListener) HandleEvent(ctx context.Context, event *event.GatewayEvent) error {
	err := l.session.OnRawEvent(&discordgo.Event{
		Operation: 0,
		Type:      event.Type,
		RawData:   event.Data,
	})
	if err != nil {
		log.Error().Err(err).Str("type", event.Type).Msg("Failed to handle event")
	}
	return nil
}

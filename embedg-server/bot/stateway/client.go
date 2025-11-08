package stateway

import (
	"context"
	"fmt"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/sharding"
	"github.com/merlinfuchs/stateway/stateway-lib/broker"
	"github.com/merlinfuchs/stateway/stateway-lib/event"
	"github.com/rs/zerolog/log"
)

type Client struct {
	Manager *sharding.ShardManager
	Broker  broker.Broker

	ctx    context.Context
	cancel context.CancelFunc
}

func NewClient(url string, manager *sharding.ShardManager) (*Client, error) {
	log.Info().Msgf("Creating stateway client with URL: %s", url)

	broker, err := broker.NewNATSBroker(url)
	if err != nil {
		return nil, fmt.Errorf("failed to create NATS broker: %w", err)
	}

	log.Info().Msgf("Created Stateway NATS broker")

	return &Client{
		Broker:  broker,
		Manager: manager,
	}, nil
}

func (c *Client) Start() error {
	c.ctx, c.cancel = context.WithCancel(context.Background())

	c.Manager.Session.SyncEvents = false

	log.Info().Msgf("Listening to Stateway NATS broker")
	err := broker.Listen(c.ctx, c.Broker, broker.NewFuncListener(
		"embedg",
		[]string{
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
		func(ctx context.Context, event *event.GatewayEvent) error {
			err := c.Manager.Session.OnRawEvent(&discordgo.Event{
				Operation: 0,
				Type:      event.Type,
				RawData:   event.Data,
			})
			if err != nil {
				log.Error().Err(err).Msg("Failed to handle message")
			}
			return nil
		},
	))
	if err != nil {
		return fmt.Errorf("failed to listen to broker: %w", err)
	}

	return nil
}

func (c *Client) Stop() error {
	if c.cancel != nil {
		c.cancel()
	}
	return nil
}

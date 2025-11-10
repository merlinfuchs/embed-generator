package stateway

import (
	"context"
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-server/bot/sharding"
	"github.com/merlinfuchs/stateway/stateway-lib/broker"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
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

	gatewayCount := viper.GetInt("nats.gateway_count")
	if gatewayCount == 0 {
		log.Info().Msg("Listening to Stateway NATS broker for all gateways")
		err := broker.Listen(c.ctx, c.Broker, &GatewayListener{
			session: c.Manager.Session,
		})
		if err != nil {
			return fmt.Errorf("failed to listen to broker: %w", err)
		}
		return nil
	} else {
		for i := 0; i < gatewayCount; i++ {
			log.Info().Msgf("Listening to Stateway NATS broker for gateway %d", i)
			err := broker.Listen(c.ctx, c.Broker, &GatewayListener{
				session:    c.Manager.Session,
				gatewayIDs: []int{i},
			})
			if err != nil {
				return fmt.Errorf("failed to listen to broker: %w", err)
			}
		}
		return nil
	}
}

func (c *Client) Stop() error {
	if c.cancel != nil {
		c.cancel()
	}
	return nil
}

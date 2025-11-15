package embedg

import (
	"context"
	"fmt"

	"github.com/disgoorg/disgo"
	"github.com/disgoorg/disgo/bot"
	discache "github.com/disgoorg/disgo/cache"
	disrest "github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/merlinfuchs/stateway/stateway-lib/broker"
	"github.com/merlinfuchs/stateway/stateway-lib/cache"
	"github.com/merlinfuchs/stateway/stateway-lib/compat"
	"github.com/merlinfuchs/stateway/stateway-lib/gateway"
)

type EmbedGeneratorConfig struct {
	Token        string
	BrokerURL    string
	GatewayCount int
}

type EmbedGenerator struct {
	client       *bot.Client
	cache        cache.Cache
	gateway      gateway.Gateway
	compatCaches discache.Caches
	broker       broker.Broker
	config       EmbedGeneratorConfig

	actionSetStore store.MessageActionSetStore
}

func NewEmbedGenerator(
	ctx context.Context,
	config EmbedGeneratorConfig,
	actionSetStore store.MessageActionSetStore,
) (*EmbedGenerator, error) {
	br, err := broker.NewNATSBroker(config.BrokerURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create NATS broker: %w", err)
	}

	compatGateway := compat.NewDisgoGateway(br, compat.DisgoGatewayConfig{
		GatewayCount: config.GatewayCount,
		EventTypes: []string{
			"message.delete",
			"channel.delete",
			"webhooks.update",
			"interaction.>",
			"entitlement.>",
		},
	})

	client, err := disgo.New(
		config.Token,
		bot.WithGateway(compatGateway),
		bot.WithRest(rest.NewRestClient(config.Token)),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create Discord client: %w", err)
	}

	compatGateway.EventHandlerFunc = client.EventManager.HandleGatewayEvent

	cache := cache.NewCacheClient(br, cache.WithAppID(client.ApplicationID))
	compatCaches := compat.NewDisgoCaches(ctx, cache)

	gateway := gateway.NewGatewayClient(br)

	embedg := &EmbedGenerator{
		client:         client,
		cache:          cache,
		gateway:        gateway,
		compatCaches:   compatCaches,
		broker:         br,
		config:         config,
		actionSetStore: actionSetStore,
	}

	client.AddEventListeners(
		bot.NewListenerFunc(embedg.onMessageDelete),
		embedg.interactionMux(),
	)

	return embedg, nil
}

func (g *EmbedGenerator) Client() *bot.Client {
	return g.client
}

func (g *EmbedGenerator) Rest() disrest.Rest {
	return g.client.Rest
}

func (g *EmbedGenerator) Cache() cache.Cache {
	return g.cache
}

func (g *EmbedGenerator) Gateway() gateway.Gateway {
	return g.gateway
}

func (g *EmbedGenerator) Caches() discache.Caches {
	return g.compatCaches
}

func (g *EmbedGenerator) Open(ctx context.Context) error {
	return g.client.OpenGateway(ctx)
}

func (g *EmbedGenerator) AppInviteURL() string {
	return fmt.Sprintf("https://discord.com/oauth2/authorize?client_id=%s&scope=bot%%20applications.commands&permissions=536945664", g.client.ApplicationID)
}

func (g *EmbedGenerator) ApplicationID() common.ID {
	return g.client.ApplicationID
}

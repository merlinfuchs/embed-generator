package embedg

import (
	"context"
	"fmt"

	"github.com/disgoorg/disgo"
	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/gateway"
	disrest "github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/disgo/sharding"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg/rest"
)

type EmbedGeneratorConfig struct {
	Token       string
	Shards      common.Shards
	DiscordLink string
}

type EmbedGenerator struct {
	client *bot.Client
	config EmbedGeneratorConfig
}

func NewEmbedGenerator(
	ctx context.Context,
	config EmbedGeneratorConfig,
) (*EmbedGenerator, error) {
	client, err := disgo.New(
		config.Token,
		bot.WithShardManagerConfigOpts(
			sharding.WithShardCount(config.Shards.Count),
			sharding.WithShardIDs(config.Shards.All()...),
			sharding.WithGatewayConfigOpts(gateway.WithIntents(
				// Guilds covers the guild, channel and role events the guild table and the guild
				// state provider are kept fresh by; GuildMessages is only for message deletes.
				gateway.IntentGuilds|gateway.IntentGuildMessages,
			)),
		),
		// No guild, channel or role cache: 250k guilds would be around 9 GB. Reads go through
		// the guild state provider instead.
		bot.WithCacheConfigOpts(cache.WithCaches(cache.FlagsNone)),
		bot.WithEventManagerConfigOpts(bot.WithAsyncEventsEnabled()),
		bot.WithRest(rest.NewRestClient(config.Token)),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create Discord client: %w", err)
	}

	return &EmbedGenerator{
		client: client,
		config: config,
	}, nil
}

func (g *EmbedGenerator) Client() *bot.Client {
	return g.client
}

func (g *EmbedGenerator) Rest() disrest.Rest {
	return g.client.Rest
}

func (g *EmbedGenerator) ShardManager() sharding.ShardManager {
	return g.client.ShardManager
}

func (g *EmbedGenerator) Open(ctx context.Context) error {
	return g.client.OpenShardManager(ctx)
}

func (g *EmbedGenerator) Close(ctx context.Context) {
	g.client.Close(ctx)
}

func (g *EmbedGenerator) AppInviteURL() string {
	return fmt.Sprintf("https://discord.com/oauth2/authorize?client_id=%s&scope=bot%%20applications.commands&permissions=536945664", g.client.ApplicationID)
}

func (g *EmbedGenerator) ApplicationID() common.ID {
	return g.client.ApplicationID
}

func (g *EmbedGenerator) GenericEvent() *events.GenericEvent {
	return events.NewGenericEvent(g.client, 0, 0)
}

func (g *EmbedGenerator) DispatchEvent(event bot.Event) {
	g.client.EventManager.DispatchEvent(event)
}

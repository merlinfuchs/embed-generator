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
	Token string
	// Shards is empty for the admin CLI, which only needs the rest client. Asking for a shard
	// manager costs a GetGatewayBot round trip even when nothing ever opens it.
	Shards common.Shards
}

type EmbedGenerator struct {
	client *bot.Client
}

func NewEmbedGenerator(config EmbedGeneratorConfig) (*EmbedGenerator, error) {
	opts := []bot.ConfigOpt{
		// No guild, channel or role cache: 250k guilds would be around 9 GB. Reads go through
		// the guild state provider instead.
		bot.WithCacheConfigOpts(cache.WithCaches(cache.FlagsNone)),
		bot.WithEventManagerConfigOpts(bot.WithAsyncEventsEnabled()),
		bot.WithRest(rest.NewRestClient(config.Token)),
	}

	if config.Shards.Count > 0 {
		opts = append(opts, bot.WithShardManagerConfigOpts(
			sharding.WithShardCount(config.Shards.Count),
			sharding.WithShardIDs(config.Shards.IDs...),
			sharding.WithGatewayConfigOpts(
				// Guilds covers the guild, channel and role events the guild table and the guild
				// state provider are kept fresh by. Not GuildMessages: it is an intent for every
				// message sent in every guild, which at this scale is tens of MB a second that
				// stalls the shard read loops until they miss heartbeats and reconnect. The only
				// thing it bought was deleting action sets for deleted messages, which can be a
				// sweep instead.
				gateway.WithIntents(gateway.IntentGuilds),
			),
		))
	}

	client, err := disgo.New(config.Token, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create Discord client: %w", err)
	}

	return &EmbedGenerator{client: client}, nil
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

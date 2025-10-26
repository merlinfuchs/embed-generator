package embedg

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"

	"github.com/disgoorg/disgo"
	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/gateway"
	"github.com/disgoorg/disgo/handler"
	disgorest "github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/disgo/sharding"
	actionshandler "github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	actionsparser "github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/embedg/rest"
)

type EmbedGeneratorConfig struct {
	DiscordToken string
}

type EmbedGenerator struct {
	ctx context.Context

	cfg EmbedGeneratorConfig

	client       *bot.Client
	clientRouter handler.Router
	rest         *rest.RestClient

	pg            *postgres.PostgresStore
	actionHandler *actionshandler.ActionHandler
	actionParser  *actionsparser.ActionParser
}

func NewEmbedGenerator(
	ctx context.Context,
	cfg EmbedGeneratorConfig,

	pg *postgres.PostgresStore,
	actionHandler *actionshandler.ActionHandler,
	actionParser *actionsparser.ActionParser,
) (*EmbedGenerator, error) {
	clientRouter := handler.New()

	client, err := disgo.New(cfg.DiscordToken,
		bot.WithShardManagerConfigOpts(
			sharding.WithAutoScaling(false),
			sharding.WithGatewayConfigOpts(
				gateway.WithIntents(
					gateway.IntentGuilds,
					gateway.IntentGuildMembers,
					gateway.IntentGuildExpressions,
					gateway.IntentGuildMessages,
					gateway.IntentMessageContent,
				),
				gateway.WithPresenceOpts(
					gateway.WithCustomActivity("message.style"),
				),
			),
		),
		bot.WithEventManagerConfigOpts(
			bot.WithAsyncEventsEnabled(),
		),
		bot.WithRestClient(rest.NewRestClient(cfg.DiscordToken)),
		bot.WithCacheConfigOpts(
			cache.WithCaches(
				cache.FlagGuilds,
				cache.FlagChannels,
				cache.FlagRoles,
				cache.FlagEmojis,
			),
		),
		bot.WithEventListenerFunc(func(e *events.Ready) {
			slog.Info(
				"Shard is ready",
				slog.String("shard_id", strconv.Itoa(e.ShardID())),
				slog.String("user_id", e.User.ID.String()),
				slog.String("username", e.User.Username),
			)
		}),
		bot.WithEventListeners(clientRouter),
	)
	if err != nil {
		return nil, fmt.Errorf("Failed to create client: %w", err)
	}

	embedg := &EmbedGenerator{
		ctx: ctx,
		cfg: cfg,

		client:       client,
		clientRouter: clientRouter,

		pg:            pg,
		actionHandler: actionHandler,
		actionParser:  actionParser,
	}

	embedg.registerHandlers()

	return embedg, nil
}

func (g *EmbedGenerator) Start(ctx context.Context) error {
	if err := g.client.OpenShardManager(ctx); err != nil {
		return err
	}

	return nil
}

func (g *EmbedGenerator) Close(ctx context.Context) {
	g.client.Close(ctx)
}

func (g *EmbedGenerator) Client() *bot.Client {
	return g.client
}

func (g *EmbedGenerator) Caches() cache.Caches {
	return g.client.Caches
}

func (g *EmbedGenerator) Rest() disgorest.Rest {
	return g.client.Rest
}

func (g *EmbedGenerator) ActionHandler() *actionshandler.ActionHandler {
	return g.actionHandler
}

func (g *EmbedGenerator) ActionParser() *actionsparser.ActionParser {
	return g.actionParser
}

package server

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-service/api"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/command"
	"github.com/merlinfuchs/embed-generator/embedg-service/config"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/s3"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/custom_bot"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/guild"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/premium"
	scheduled_messages "github.com/merlinfuchs/embed-generator/embedg-service/manager/scheduled_message"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/webhook"
	"github.com/sashabaranov/go-openai"
)

const gatewayCloseTimeout = 10 * time.Second

func Run(ctx context.Context, pg *postgres.Client, blob *s3.Client, cfg *config.RootConfig) error {
	if cfg.Discord.RestURL != "" {
		slog.Info("Using custom Discord REST URL", "url", cfg.Discord.RestURL)
		rest.ProxyURL = cfg.Discord.RestURL
	}

	shards := cfg.Discord.Shards()

	embedg, err := embedg.NewEmbedGenerator(embedg.EmbedGeneratorConfig{
		Token:  cfg.Discord.Token,
		Shards: shards,
	})
	if err != nil {
		return fmt.Errorf("failed to create embedg: %w", err)
	}

	premiumManager := premium.NewPremiumManager(premium.Config{
		BeneficialGuildID: cfg.Premium.BeneficialGuildID,
		BeneficialRoleID:  cfg.Premium.BeneficialRoleID,
		Plans:             cfg.Premium.Plans,
	}, shards, embedg.Rest(), pg, embedg)
	embedg.Client().AddEventListeners(premiumManager)
	go premiumManager.Run(ctx)

	guildState := guildstate.New(embedg.Rest())
	embedg.Client().AddEventListeners(guildState)

	sessionManager := session.New(session.SessionManagerConfig{
		InsecureCookies: cfg.API.InsecureCookies,
		APIPublicURL:    cfg.API.PublicURL,
		ClientID:        cfg.Discord.ClientID,
		ClientSecret:    cfg.Discord.ClientSecret,
	}, pg)
	accessManager := access.New(guildState, pg, embedg.Rest(), embedg, sessionManager)
	actionParser := parser.New(accessManager, pg, pg, guildState)
	actionHandler := handler.New(
		pg,
		pg,
		pg,
		pg,
		actionParser,
		premiumManager,
		guildState,
	)
	customBotManager := custom_bot.NewCustomBotManager(pg, embedg.Rest(), shards)
	go customBotManager.Run(ctx)

	webhookManager := webhook.NewWebhookManager(embedg.Rest(), guildState, customBotManager)
	embedg.Client().AddEventListeners(webhookManager)

	handler := NewEventHandler(EventHandlerConfig{
		DiscordLink: cfg.Links.Discord,
	}, embedg, embedg.Rest(), pg, actionHandler)
	embedg.Client().AddEventListeners(handler)

	guildTracker := guild.NewGuildTracker(pg, shards)
	embedg.Client().AddEventListeners(guildTracker)
	go guildTracker.Run(ctx)

	commandHandler := command.NewCommandHandler(command.CommandHandlerConfig{
		DiscordLink:  cfg.Links.Discord,
		AppPublicURL: cfg.App.PublicURL,
	}, guildState, embedg.Rest(), embedg, pg, actionParser, webhookManager)
	embedg.Client().AddEventListeners(commandHandler)

	scheduledMessageManager := scheduled_messages.NewScheduledMessageManager(
		pg,
		pg,
		pg,
		actionParser,
		webhookManager,
		guildState,
		embedg.Rest(),
		premiumManager,
		shards,
	)
	embedg.Client().AddEventListeners(scheduledMessageManager)
	go scheduledMessageManager.Run(ctx)

	if cfg.API.PprofAddr != "" {
		go servePprof(ctx, cfg.API.PprofAddr)
	}

	slog.Info("Starting Embed Generator")

	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	defer func() {
		closeCtx, cancel := context.WithTimeout(context.Background(), gatewayCloseTimeout)
		defer cancel()
		embedg.Close(closeCtx)
	}()

	// Opening blocks until every shard has identified, which takes minutes at a few hundred
	// shards, so the API serves while that happens. /api/health/shards reports the progress.
	gatewayErr := make(chan error, 1)
	go func() {
		if err := embedg.Open(ctx); err != nil {
			gatewayErr <- err
			cancel()
		}
	}()

	api.Serve(ctx, &api.Env{
		UserStore:             pg,
		SharedMessageStore:    pg,
		SavedMessageStore:     pg,
		MessageActionSetStore: pg,
		ScheduledMessageStore: pg,
		CustomBotStore:        pg,
		GuildStore:            pg,
		GuildState:            guildState,
		CustomCommandStore:    pg,
		ImageStore:            pg,
		EmbedLinkStore:        pg,
		SessionManager:        sessionManager,
		CustomBotManager:      customBotManager,
		KVEntryStore:          pg,
		EntitlementStore:      pg,
		PremiumManager:        premiumManager,
		WebhookManager:        webhookManager,
		AccessManager:         accessManager,
		ActionParser:          actionParser,
		ActionHandler:         actionHandler,
		Rest:                  embedg.Rest(),
		ShardManager:          embedg.ShardManager(),
		OpenAIClient:          openai.NewClient(cfg.OpenAI.APIKey),
		FileStore:             blob,
		AppContext:            embedg,
		EventDispatcher:       embedg,
	}, api.APIConfig{
		Host:             cfg.API.Host,
		Port:             cfg.API.Port,
		AppPublicURL:     cfg.App.PublicURL,
		APIPublicURL:     cfg.API.PublicURL,
		CDNPublicURL:     cfg.CDN.PublicURL,
		DiscordLink:      cfg.Links.Discord,
		SourceLink:       cfg.Links.Source,
		DiscordPublicKey: cfg.Discord.PublicKey,
		InsecureCookies:  cfg.API.InsecureCookies,
	})

	select {
	case err := <-gatewayErr:
		return fmt.Errorf("failed to open the Discord gateway: %w", err)
	default:
		return nil
	}
}

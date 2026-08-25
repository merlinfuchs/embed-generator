package server

import (
	"context"
	"fmt"
	"log/slog"

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
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/custom_bot"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/premium"
	scheduled_messages "github.com/merlinfuchs/embed-generator/embedg-service/manager/scheduled_message"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/webhook"
	"github.com/sashabaranov/go-openai"
)

func Run(ctx context.Context, pg *postgres.Client, blob *s3.Client, cfg *config.RootConfig) error {
	if cfg.Discord.RestURL != "" {
		slog.Info("Using custom Discord REST URL", "url", cfg.Discord.RestURL)
		rest.ProxyURL = cfg.Discord.RestURL
	}

	embedg, err := embedg.NewEmbedGenerator(ctx, embedg.EmbedGeneratorConfig{
		Token:        cfg.Discord.Token,
		BrokerURL:    cfg.Broker.NATS.URL,
		GatewayCount: cfg.Broker.GatewayCount,
		DiscordLink:  cfg.Links.Discord,
	})
	if err != nil {
		return fmt.Errorf("failed to create embedg: %w", err)
	}

	premiumManager := premium.NewPremiumManager(premium.Config{
		BeneficialGuildID: cfg.Premium.BeneficialGuildID,
		BeneficialRoleID:  cfg.Premium.BeneficialRoleID,
		Plans:             cfg.Premium.Plans,
	}, embedg.Rest(), pg, embedg)
	embedg.Client().AddEventListeners(premiumManager)
	go premiumManager.Run(ctx)

	accessManager := access.New(embedg.Cache(), embedg.Caches(), embedg.Rest(), embedg)
	actionParser := parser.New(accessManager, pg, pg, embedg.Caches())
	actionHandler := handler.New(
		pg,
		pg,
		pg,
		pg,
		actionParser,
		premiumManager,
	)
	customBotManager := custom_bot.NewCustomBotManager(pg, embedg.Rest(), embedg.Gateway())
	go customBotManager.Run(ctx)

	webhookManager := webhook.NewWebhookManager(embedg.Rest(), embedg.Caches(), customBotManager)
	embedg.Client().AddEventListeners(webhookManager)

	handler := NewEventHandler(EventHandlerConfig{
		DiscordLink: cfg.Links.Discord,
	}, embedg, embedg.Rest(), embedg.Caches(), pg, actionHandler)
	embedg.Client().AddEventListeners(handler)

	commandHandler := command.NewCommandHandler(command.CommandHandlerConfig{
		DiscordLink:  cfg.Links.Discord,
		AppPublicURL: cfg.App.PublicURL,
	}, embedg.Caches(), embedg.Rest(), embedg, pg, actionParser, webhookManager)
	embedg.Client().AddEventListeners(commandHandler)

	sessionManager := session.New(session.SessionManagerConfig{
		InsecureCookies: cfg.API.InsecureCookies,
	}, pg)
	scheduledMessageManager := scheduled_messages.NewScheduledMessageManager(
		pg,
		pg,
		pg,
		actionParser,
		webhookManager,
		embedg.Caches(),
		premiumManager,
	)
	embedg.Client().AddEventListeners(scheduledMessageManager)
	go scheduledMessageManager.Run(ctx)

	slog.Info("Starting Embed Generator")

	err = embedg.Open(ctx)
	if err != nil {
		return fmt.Errorf("failed to run embedg: %w", err)
	}

	api.Serve(ctx, &api.Env{
		UserStore:             pg,
		SharedMessageStore:    pg,
		SavedMessageStore:     pg,
		MessageActionSetStore: pg,
		ScheduledMessageStore: pg,
		CustomBotStore:        pg,
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
		Gateway:               embedg.Gateway(),
		Caches:                embedg.Caches(),
		Rest:                  embedg.Rest(),
		OpenAIClient:          openai.NewClient(cfg.OpenAI.APIKey),
		FileStore:             blob,
		AppContext:            embedg,
		EventDispatcher:       embedg,
	}, api.APIConfig{
		Host:                cfg.API.Host,
		Port:                cfg.API.Port,
		AppPublicURL:        cfg.App.PublicURL,
		APIPublicURL:        cfg.API.PublicURL,
		CDNPublicURL:        cfg.CDN.PublicURL,
		DiscordLink:         cfg.Links.Discord,
		SourceLink:          cfg.Links.Source,
		DiscordClientID:     cfg.Discord.ClientID,
		DiscordClientSecret: cfg.Discord.ClientSecret,
		DiscordPublicKey:    cfg.Discord.PublicKey,
		InsecureCookies:     cfg.API.InsecureCookies,
	})

	return nil
}

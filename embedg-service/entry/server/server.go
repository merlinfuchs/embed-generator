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
	"github.com/merlinfuchs/embed-generator/embedg-service/config"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/s3"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/custom_bot"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/premium"
	scheduled_messages "github.com/merlinfuchs/embed-generator/embedg-service/manager/scheduled_message"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/webhook"
	"github.com/sashabaranov/go-openai"
)

func Run(ctx context.Context, pg *postgres.Client, blob *s3.Client, cfg *config.RootConfig) error {
	embedg, err := embedg.NewEmbedGenerator(ctx, embedg.EmbedGeneratorConfig{
		Token:        cfg.Discord.Token,
		BrokerURL:    cfg.Broker.NATS.URL,
		GatewayCount: cfg.Broker.GatewayCount,
	}, pg)
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

	accessManager := access.New(embedg.Caches(), embedg.Rest(), embedg)
	actionParser := parser.New(accessManager, pg, pg, embedg.Caches())
	actionHandler := handler.New(
		pg,
		pg,
		pg,
		pg,
		actionParser,
		premiumManager,
	)

	customBotManager := custom_bot.NewCustomBotManager(pg, embedg.Rest())
	sessionManager := session.New(pg)
	webhookManager := webhook.NewWebhookManager(embedg.Rest(), embedg.Caches(), customBotManager)
	embedg.Client().AddEventListeners(webhookManager)

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
		Caches:                embedg.Caches(),
		Rest:                  embedg.Rest(),
		OpenAIClient:          openai.NewClient(cfg.OpenAI.APIKey),
		FileStore:             blob,
		AppContext:            embedg,
		// TODO: InteractionDispatcher: interactionDispatcher,
	}, cfg.API.Host, cfg.API.Port)

	return nil
}

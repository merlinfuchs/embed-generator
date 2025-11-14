package server

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-service/config"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/custom_bot"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/premium"
	scheduled_messages "github.com/merlinfuchs/embed-generator/embedg-service/manager/scheduled_message"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/webhook"
)

func Run(ctx context.Context, pg *postgres.Client, cfg *config.RootConfig) error {
	embedg, err := embedg.NewEmbedGenerator(ctx, embedg.EmbedGeneratorConfig{
		Token:        cfg.Discord.Token,
		BrokerURL:    cfg.Broker.NATS.URL,
		GatewayCount: cfg.Broker.GatewayCount,
	}, pg)
	if err != nil {
		return fmt.Errorf("failed to create embedg: %w", err)
	}

	accessManager := access.New(embedg.Caches(), embedg.Rest())
	actionParser := parser.New(accessManager, pg, pg, embedg.Caches())

	premiumManager := premium.NewPremiumManager(premium.Config{
		BeneficialGuildID: cfg.Premium.BeneficialGuildID,
		BeneficialRoleID:  cfg.Premium.BeneficialRoleID,
		Plans:             cfg.Premium.Plans,
	}, embedg.Rest(), pg)
	embedg.Client().AddEventListeners(premiumManager)
	go premiumManager.Run(ctx)

	customBotManager := custom_bot.NewCustomBotManager(pg, embedg.Rest())

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

	<-ctx.Done()
	return nil
}

package server

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/merlinfuchs/embed-generator/embedg-service/config"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/premium"
)

func Run(ctx context.Context, pg *postgres.Client, cfg *config.RootConfig) error {
	embedg, err := embedg.NewEmbedGenerator(embedg.EmbedGeneratorConfig{
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
	}, embedg.Rest(), pg)
	embedg.Client().AddEventListeners(premiumManager)
	go premiumManager.Run(ctx)

	slog.Info("Starting Embed Generator")

	err = embedg.Open(ctx)
	if err != nil {
		return fmt.Errorf("failed to run embedg: %w", err)
	}

	<-ctx.Done()
	return nil
}

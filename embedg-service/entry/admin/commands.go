package admin

import (
	"context"
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-service/config"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg"
)

func SyncCommands(ctx context.Context, pg *postgres.Client, cfg *config.RootConfig) error {
	embedg, err := embedg.NewEmbedGenerator(ctx, embedg.EmbedGeneratorConfig{
		Token:        cfg.Discord.Token,
		BrokerURL:    cfg.Broker.NATS.URL,
		GatewayCount: cfg.Broker.GatewayCount,
	}, pg)
	if err != nil {
		return fmt.Errorf("failed to create embedg: %w", err)
	}

	return embedg.SyncCommands(ctx)
}

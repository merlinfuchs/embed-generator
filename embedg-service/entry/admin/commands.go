package admin

import (
	"context"
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-service/command"
	"github.com/merlinfuchs/embed-generator/embedg-service/config"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg"
)

func SyncCommands(ctx context.Context, pg *postgres.Client, cfg *config.RootConfig) error {
	// No shards: this only needs the rest client, and asking for a shard manager would cost a
	// GetGatewayBot call for a connection nothing opens.
	embedg, err := embedg.NewEmbedGenerator(embedg.EmbedGeneratorConfig{
		Token: cfg.Discord.Token,
	})
	if err != nil {
		return fmt.Errorf("failed to create embedg: %w", err)
	}

	return command.SyncCommands(ctx, embedg.Rest(), embedg)
}

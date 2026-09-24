package cmd

import (
	"context"
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-server/config"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/s3"
	"github.com/merlinfuchs/embed-generator/embedg-server/logging"
)

type env struct {
	pg   *postgres.Client
	blob *s3.Client
	cfg  *config.RootConfig
}

func setupEnv(ctx context.Context) (*env, error) {
	cfg, err := config.LoadConfig[*config.RootConfig]()
	if err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}

	logging.SetupLogger(logging.LoggerConfig(cfg.Logging))

	pg, err := postgres.New(ctx, postgres.ClientConfig(cfg.Database.Postgres))
	if err != nil {
		return nil, fmt.Errorf("failed to create postgres client: %w", err)
	}

	blob, err := s3.New(s3.ClientConfig(cfg.Database.S3))
	if err != nil {
		return nil, fmt.Errorf("failed to create blob client: %w", err)
	}

	return &env{
		pg:   pg,
		blob: blob,
		cfg:  cfg,
	}, nil
}

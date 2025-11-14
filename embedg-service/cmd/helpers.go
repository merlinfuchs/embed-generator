package cmd

import (
	"context"
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-service/config"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-service/logging"
)

type env struct {
	pg  *postgres.Client
	cfg *config.RootConfig
}

func setupEnv(ctx context.Context, debug bool) (*env, error) {
	cfg, err := config.LoadConfig[*config.RootConfig]()
	if err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}

	loggingConfig := logging.LoggerConfig(cfg.Logging)
	if debug {
		loggingConfig.Debug = true
	}

	logging.SetupLogger(loggingConfig)

	pg, err := postgres.New(ctx, postgres.ClientConfig(cfg.Database.Postgres))
	if err != nil {
		return nil, fmt.Errorf("failed to create postgres client: %w", err)
	}

	return &env{
		pg:  pg,
		cfg: cfg,
	}, nil
}

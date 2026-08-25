package database

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/merlinfuchs/embed-generator/embedg-service/config"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-service/logging"
	"github.com/spf13/viper"
)

type MigrateOpts struct {
	TargetVersion int
}

// Common migrater interface for stores
type Migrater interface {
	Up() error
	Down() error
	To(version uint) error

	Force(version int) error
	Version() (uint, bool, error)
	List() ([]string, error)
	Close() error
	SetLogger(logger migrate.Logger)
}

func Migrate(ctx context.Context, storeName string, operation string, opts MigrateOpts) error {
	cfg, err := config.LoadConfig[*config.RootConfig]()
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}

	logging.SetupLogger(logging.LoggerConfig(cfg.Logging))

	// Contextual logger
	l := slog.Default().With(
		slog.String("entry", "migrate"),
		slog.String("store", storeName),
		slog.String("operation", operation),
	)
	l.Debug("Starting migration")

	var migrater Migrater

	switch storeName {
	case "postgres":
		pg, err := postgres.New(ctx, postgres.ClientConfig(cfg.Database.Postgres))
		if err != nil {
			return fmt.Errorf("failed to create postgres client: %w", err)
		}

		pgMigrater, err := pg.GetMigrater()
		if err != nil {
			l.Error("Failed to get migrater", slog.Any("error", err))
			os.Exit(1)
		}
		migrater = pgMigrater
		defer migrater.Close()
	default:
		l.Error("Unknown store, can't migrate")
		os.Exit(1)
	}

	migrater.SetLogger(migrationSlogLogger{
		logger:  l,
		verbose: viper.GetBool("debug"),
	})

	switch operation {
	case "up":
		err = migrater.Up()
	case "down":
		err = migrater.Down()
	case "list":
		var migrations []string
		migrations, err = migrater.List()
		if err != nil {
			break
		}
		l.Info("", slog.Any("migrations", migrations))
	case "version":
		var version uint
		var dirty bool
		version, dirty, err = migrater.Version()
		if err != nil {
			break
		}
		l.Info("", slog.Uint64("version", uint64(version)), slog.Bool("dirty", dirty))

	case "force":
		l = l.With(slog.Int("target_version", opts.TargetVersion))
		err = migrater.Force(opts.TargetVersion)
		if err != nil {
			break
		}

	case "to":
		l = l.With(slog.Int("target_version", opts.TargetVersion))
		if opts.TargetVersion < 0 {
			l.Error("Invalid target version for migrate")
		}
		err = migrater.To(uint(opts.TargetVersion))
		if err != nil {
			break
		}
	}

	if err == migrate.ErrNoChange {
		l.Warn("Already at the correct version, migration was skipped")
	} else if err == migrate.ErrNilVersion {
		l.Warn("Migration is at nil version (no migrations have been performed)")
	} else if err != nil {
		l.Error("Migration operation failed", slog.Any("error", err))
	}

	l.Debug("Migration end")

	return nil
}

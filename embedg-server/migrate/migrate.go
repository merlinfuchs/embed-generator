package migrate

import (
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/merlinfuchs/embed-generator/embedg-server/config"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/telemetry"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
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

func Migrate(storeName string, operation string, opts MigrateOpts) {
	config.InitConfig()

	telemetry.SetupLogger()

	// Contextual logger
	l := log.With().Str("entry", "migrate").Str("store", storeName).Str("operation", operation).Logger()
	l.Debug().Msg("Starting migration")

	var migrater Migrater

	switch storeName {
	case "postgres":
		pg := postgres.NewPostgresStore()
		pgMigrater, err := pg.GetMigrater()
		if err != nil {
			l.Error().Err(err).Msg("Failed to get migrater")
			os.Exit(1)
		}
		migrater = pgMigrater
		defer migrater.Close()
	default:
		l.WithLevel(zerolog.FatalLevel).Msg("Unknown store, can't migrate")
		os.Exit(1)
	}

	migrater.SetLogger(migrationZeroLogger{
		zerologger: l,
		verbose:    viper.GetBool("debug"),
	})

	var err error
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
		l.Info().Strs("migrations", migrations).Msg("")
	case "version":
		var version uint
		var dirty bool
		version, dirty, err = migrater.Version()
		if err != nil {
			break
		}
		l.Info().Uint("version", version).Bool("dirty", dirty).Msg("")

	case "force":
		l = l.With().Int("target_version", opts.TargetVersion).Logger()
		err = migrater.Force(opts.TargetVersion)
		if err != nil {
			break
		}

	case "to":
		l = l.With().Int("target_version", opts.TargetVersion).Logger()
		if opts.TargetVersion < 0 {
			l.WithLevel(zerolog.FatalLevel).Err(err).Msg("Invalid target version for migrate")
		}
		err = migrater.To(uint(opts.TargetVersion))
		if err != nil {
			break
		}
	}

	if err == migrate.ErrNoChange {
		l.Warn().Msg("Already at the correct version, migration was skipped")
	} else if err == migrate.ErrNilVersion {
		l.Warn().Msg("Migration is at nil version (no migrations have been performed)")
	} else if err != nil {
		l.WithLevel(zerolog.FatalLevel).Err(err).Msg("Migration operation failed")
	}

	l.Debug().Msg("Migration end")
}

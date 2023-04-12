package postgres

import (
	"database/sql"
	"embed"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

type PostgresStoreMigrater struct {
	m     *migrate.Migrate
	close func() error
}

func (mig *PostgresStoreMigrater) Up() error {
	return mig.m.Up()
}

func (mig *PostgresStoreMigrater) Down() error {
	return mig.m.Down()
}

func (mig *PostgresStoreMigrater) Version() (uint, bool, error) {
	return mig.m.Version()
}

func (mig *PostgresStoreMigrater) To(version uint) error {
	return mig.m.Migrate(version)
}

func (mig *PostgresStoreMigrater) Force(version int) error {
	return mig.m.Force(version)
}

func (mig *PostgresStoreMigrater) List() ([]string, error) {
	dirEntries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return nil, err
	}

	migrationFiles := make([]string, 0)
	for _, entry := range dirEntries {
		migrationFiles = append(migrationFiles, entry.Name())
	}
	return migrationFiles, nil
}

func (mig *PostgresStoreMigrater) Close() error {
	return mig.close()
}

func (mig *PostgresStoreMigrater) SetLogger(logger migrate.Logger) {
	mig.m.Log = logger
}

func (pgs *PostgresStore) GetMigrater() (*PostgresStoreMigrater, error) {
	d, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return nil, fmt.Errorf("failed to open Postgres migrations iofs: %w", err)
	}

	connString := BuildConnectionDSN()
	db, err := sql.Open("postgres", connString)
	if err != nil {
		return nil, fmt.Errorf("failed to open postgres db with postgres driver: %w", err)
	}
	defer db.Close()

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to open postgres migration: %w", err)
	}

	m, err := migrate.NewWithInstance(
		"iofs", d,
		"postgres", driver)
	if err != nil {
		return nil, fmt.Errorf("failed to create Postgres migrate instance: %w", err)
	}

	close := func() error {
		err1, err2 := m.Close()
		if err1 != nil || err2 != nil {
			return fmt.Errorf("source close error: %v, driver close error: %v", err1, err2)
		}
		return nil
	}

	return &PostgresStoreMigrater{
		m:     m,
		close: close,
	}, nil
}

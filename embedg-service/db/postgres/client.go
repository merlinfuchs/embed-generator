package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
)

type Client struct {
	DB            *pgxpool.Pool
	Q             *pgmodel.Queries
	connectionDSN string
}

type ClientConfig struct {
	Host     string
	Port     int
	DBName   string
	User     string
	Password string
}

func New(ctx context.Context, config ClientConfig) (*Client, error) {
	connectionDSN := BuildConnectionDSN(config)

	db, err := pgxpool.New(ctx, connectionDSN)
	if err != nil {
		return nil, fmt.Errorf("Failed to connect to postgres db: %v", err)
	}

	return &Client{
		DB:            db,
		Q:             pgmodel.New(db),
		connectionDSN: connectionDSN,
	}, nil
}

func BuildConnectionDSN(cfg ClientConfig) string {
	dsn := fmt.Sprintf(
		"host=%s port=%d dbname=%s user=%s sslmode=disable connect_timeout=4",
		cfg.Host, cfg.Port, cfg.DBName, cfg.User,
	)

	if cfg.Password != "" {
		dsn += " password=" + cfg.Password
	}
	return dsn
}

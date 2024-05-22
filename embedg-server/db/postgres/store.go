package postgres

import (
	"fmt"
	"log"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/spf13/viper"
)

func BuildConnectionDSN() string {
	dbname := viper.GetString("postgres.dbname")
	password := viper.GetString("postgres.password")

	dsn := fmt.Sprintf("host=%s port=%d dbname=%s user=%s sslmode=disable",
		viper.GetString("postgres.host"), viper.GetInt("postgres.port"), dbname, viper.GetString("postgres.user"))

	if password != "" {
		dsn += " password=" + password
	}
	return dsn

}

type PostgresStore struct {
	db *sqlx.DB
	Q  *pgmodel.Queries
}

func NewPostgresStore() *PostgresStore {
	db, err := sqlx.Open("postgres", BuildConnectionDSN())
	if err != nil {
		log.Fatalf("Failed to connect to postgres store: %v", err)
	}

	db.SetMaxIdleConns(20)
	db.SetMaxOpenConns(80)
	db.SetConnMaxLifetime(time.Hour * 1)

	return &PostgresStore{
		db: db,
		Q:  pgmodel.New(db),
	}
}

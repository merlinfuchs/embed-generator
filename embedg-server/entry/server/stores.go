package server

import (
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/s3"
	"github.com/rs/zerolog/log"
)

type stores struct {
	pg   *postgres.PostgresStore
	blob *s3.BlobStore
}

func createStores() *stores {
	pg := postgres.NewPostgresStore()

	blob, err := s3.New()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize blob store")
	}

	return &stores{
		pg:   pg,
		blob: blob,
	}
}

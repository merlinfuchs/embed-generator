package api

import (
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/s3"
)

type Stores struct {
	PG   *postgres.PostgresStore
	Blob *s3.BlobStore
}

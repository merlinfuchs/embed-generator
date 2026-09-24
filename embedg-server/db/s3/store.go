package s3

import (
	"context"
	"encoding/hex"
	"fmt"
	"time"

	"log/slog"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/minio/minio-go/v7/pkg/encrypt"
)

var requiredBuckets = []string{
	imagesBucketName,
	dbBackupBucket,
}

// How long we wait for the object storage to respond during startup before
// giving up and continuing without it.
const bucketSetupTimeout = 10 * time.Second

type ClientConfig struct {
	Endpoint        string `toml:"endpoint" validate:"required"`
	AccessKeyID     string `toml:"access_key_id" validate:"required"`
	SecretAccessKey string `toml:"secret_access_key" validate:"required"`
	Secure          bool   `toml:"secure"`
	SSECKey         string `toml:"ssec_key"`
}

type Client struct {
	client     *minio.Client
	encryption encrypt.ServerSide
}

func New(config ClientConfig) (*Client, error) {
	client, err := minio.New(config.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(config.AccessKeyID, config.SecretAccessKey, ""),
		Secure: config.Secure,
	})
	if err != nil {
		return nil, err
	}

	var encryption encrypt.ServerSide
	if config.SSECKey != "" {
		key, err := hex.DecodeString(config.SSECKey)
		if err != nil {
			return nil, fmt.Errorf("failed to decode S3 encryption key: %w", err)
		}

		encryption, err = encrypt.NewSSEC(key)
		if err != nil {
			return nil, fmt.Errorf("failed to create S3 encryption: %w", err)
		}
	}

	ensureBuckets(client)

	return &Client{
		client:     client,
		encryption: encryption,
	}, nil
}

// ensureBuckets creates the buckets we need if they don't exist yet. Failures
// are only logged so that the service still starts when the object storage is
// unreachable or misconfigured.
func ensureBuckets(client *minio.Client) {
	ctx, cancel := context.WithTimeout(context.Background(), bucketSetupTimeout)
	defer cancel()

	for _, bucket := range requiredBuckets {
		exists, err := client.BucketExists(ctx, bucket)
		if err != nil {
			slog.Warn(
				"Failed to check if bucket exists, is S3 correctly configured?",
				"bucket", bucket,
				"error", err,
			)
			continue
		}

		if !exists {
			if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
				slog.Warn(
					"Failed to create bucket, is S3 correctly configured?",
					"bucket", bucket,
					"error", err,
				)
			}
		}
	}
}

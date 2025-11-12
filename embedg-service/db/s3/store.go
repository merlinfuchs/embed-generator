package s3

import (
	"context"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/minio/minio-go/v7/pkg/encrypt"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

var requiredBuckets = []string{
	imagesBucketName,
	dbBackupBucket,
}

type BlobStore struct {
	client     *minio.Client
	encryption encrypt.ServerSide
}

func New() (*BlobStore, error) {
	client, err := minio.New(viper.GetString("s3.endpoint"), &minio.Options{
		Creds:  credentials.NewStaticV4(viper.GetString("s3.access_key_id"), viper.GetString("s3.secret_access_key"), ""),
		Secure: viper.GetBool("s3.secure"),
	})
	if err != nil {
		return nil, err
	}

	for _, bucket := range requiredBuckets {
		exists, err := client.BucketExists(context.Background(), bucket)
		if err != nil {
			if strings.Contains(err.Error(), "connection refused") {
				log.Warn().Msgf("Failed to check if bucket %s exists, is S3 correctly configured?", bucket)
				continue
			}
			return nil, fmt.Errorf("Failed to check if bucket %s exists: %w", bucket, err)
		}

		if !exists {
			err = client.MakeBucket(context.Background(), bucket, minio.MakeBucketOptions{})
			if err != nil {
				return nil, fmt.Errorf("Failed to create bucket %s: %w", bucket, err)
			}
		}
	}

	var encryption encrypt.ServerSide
	if viper.GetString("s3.ssec_key") != "" {
		key, err := hex.DecodeString(viper.GetString("s3.ssec_key"))
		if err != nil {
			return nil, fmt.Errorf("failed to decode S3 encryption key: %w", err)
		}

		encryption, err = encrypt.NewSSEC(key)
		if err != nil {
			return nil, fmt.Errorf("failed to create S3 encryption: %w", err)
		}
	}

	return &BlobStore{
		client:     client,
		encryption: encryption,
	}, nil
}

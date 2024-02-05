package s3

import (
	"context"
	"fmt"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

var requiredBuckets = []string{
	imagesBucketName,
}

type BlobStore struct {
	client *minio.Client
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

	return &BlobStore{client}, nil
}

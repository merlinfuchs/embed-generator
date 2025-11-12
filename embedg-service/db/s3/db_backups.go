package s3

import (
	"context"
	"fmt"
	"io"

	"github.com/minio/minio-go/v7"
)

const dbBackupBucket = "embedg-db-backups"

func (c *BlobStore) StoreDBBackup(
	ctx context.Context,
	database string,
	key string,
	size int64,
	reader io.Reader,
) error {
	objectName := fmt.Sprintf("%s/%s.tar.gz", database, key)

	_, err := c.client.PutObject(ctx, dbBackupBucket, objectName, reader, size, minio.PutObjectOptions{
		ContentType:          "application/tar+gzip",
		ServerSideEncryption: c.encryption,
	})
	if err != nil {
		return fmt.Errorf("failed to store db backup: %w", err)
	}

	return nil
}

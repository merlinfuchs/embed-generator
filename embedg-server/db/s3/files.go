package s3

import (
	"bytes"
	"context"
	"io"

	"github.com/minio/minio-go/v7"
)

const imagesBucketName = "embedg-files"

func (s *BlobStore) UploadFile(ctx context.Context, image *Image) error {
	reader := bytes.NewReader(image.Body)
	_, err := s.client.PutObject(ctx, imagesBucketName, image.FileName, reader, int64(len(image.Body)), minio.PutObjectOptions{
		ContentType:          image.ContentType,
		ServerSideEncryption: s.encryption,
	})
	if err != nil {
		return err
	}

	return err
}

func (s *BlobStore) UploadFileIfNotExists(ctx context.Context, image *Image) error {
	reader := bytes.NewReader(image.Body)

	exists, err := s.client.StatObject(ctx, imagesBucketName, image.FileName, minio.StatObjectOptions{
		ServerSideEncryption: s.encryption,
	})
	// TODO: refactor to not use error string
	if err != nil && err.Error() != "The specified key does not exist." {
		return err
	}

	if exists.Size > 0 {
		return nil
	}

	_, err = s.client.PutObject(ctx, imagesBucketName, image.FileName, reader, int64(len(image.Body)), minio.PutObjectOptions{
		ContentType:          image.ContentType,
		ServerSideEncryption: s.encryption,
	})
	return err
}

func (s *BlobStore) DownloadFile(ctx context.Context, fileName string) (*Image, error) {
	object, err := s.client.GetObject(ctx, imagesBucketName, fileName, minio.GetObjectOptions{
		ServerSideEncryption: s.encryption,
	})
	if err != nil {
		return nil, err
	}

	data, err := io.ReadAll(object)
	if err != nil {
		return nil, err
	}

	info, err := object.Stat()
	if err != nil {
		return nil, err
	}

	return &Image{
		FileName:    fileName,
		ContentType: info.ContentType,
		Body:        data,
	}, err
}

type Image struct {
	FileName    string
	ContentType string
	Body        []byte
}

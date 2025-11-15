package s3

import (
	"bytes"
	"context"
	"io"
	"strings"

	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/minio/minio-go/v7"
)

const imagesBucketName = "embedg-files"

func (s *Client) UploadFile(ctx context.Context, image model.File) error {
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

func (s *Client) UploadFileIfNotExists(ctx context.Context, image model.File) error {
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

func (s *Client) DownloadFile(ctx context.Context, fileName string) (*model.File, error) {
	object, err := s.client.GetObject(ctx, imagesBucketName, fileName, minio.GetObjectOptions{
		ServerSideEncryption: s.encryption,
	})
	if err != nil {
		if strings.Contains(err.Error(), "key does not exist") {
			return nil, nil
		}

		return nil, err
	}

	data, err := io.ReadAll(object)
	if err != nil {
		if strings.Contains(err.Error(), "key does not exist") {
			return nil, nil
		}

		return nil, err
	}

	info, err := object.Stat()
	if err != nil {
		return nil, err
	}

	return &model.File{
		FileName:    fileName,
		ContentType: info.ContentType,
		Body:        data,
	}, err
}

package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type FileStore interface {
	UploadFile(ctx context.Context, file model.File) error
	UploadFileIfNotExists(ctx context.Context, file model.File) error
	DownloadFile(ctx context.Context, fileName string) (*model.File, error)
}

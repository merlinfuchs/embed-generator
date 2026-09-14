package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type ImageStore interface {
	CreateImage(ctx context.Context, img model.Image) (*model.Image, error)
	GetImage(ctx context.Context, id string) (*model.Image, error)
}

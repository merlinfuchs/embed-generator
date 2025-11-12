package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type EmbedLinkStore interface {
	CreateEmbedLink(ctx context.Context, embedLink model.EmbedLink) (*model.EmbedLink, error)
	GetEmbedLink(ctx context.Context, id string) (*model.EmbedLink, error)
}

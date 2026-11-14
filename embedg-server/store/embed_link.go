package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

type EmbedLinkStore interface {
	CreateEmbedLink(ctx context.Context, embedLink model.EmbedLink) (*model.EmbedLink, error)
	GetEmbedLink(ctx context.Context, id string) (*model.EmbedLink, error)
	FlagEmbedLink(ctx context.Context, id string, flaggedAt time.Time, reason string) error
}

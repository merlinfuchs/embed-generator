package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type SharedMessageStore interface {
	CreateSharedMessage(ctx context.Context, msg model.SharedMessage) (*model.SharedMessage, error)
	GetSharedMessage(ctx context.Context, id string) (*model.SharedMessage, error)
	DeleteExpiredSharedMessages(ctx context.Context, now time.Time) error
}

package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"gopkg.in/guregu/null.v4"
)

type KVEntryIncreaseParams struct {
	Key       string
	GuildID   common.ID
	Delta     int
	ExpiresAt null.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

type KVEntryStore interface {
	GetKVEntry(ctx context.Context, guildID common.ID, key string) (*model.KVEntry, error)
	SetKVEntry(ctx context.Context, entry model.KVEntry) error
	IncreaseKVEntry(ctx context.Context, params KVEntryIncreaseParams) (*model.KVEntry, error)
	DeleteKVEntry(ctx context.Context, guildID common.ID, key string) (*model.KVEntry, error)
	SearchKVEntries(ctx context.Context, guildID common.ID, pattern string) ([]model.KVEntry, error)
	CountKVEntries(ctx context.Context, guildID common.ID) (int64, error)
}

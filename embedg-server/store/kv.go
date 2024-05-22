package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

type KVEntryStore interface {
	GetKVEntry(ctx context.Context, guildID string, key string) (model.KVEntry, error)
	SetKVEntry(ctx context.Context, entry model.KVEntry) error
	IncreaseKVEntry(ctx context.Context, params model.KVEntryIncreaseParams) (model.KVEntry, error)
	DeleteKVEntry(ctx context.Context, guildID string, key string) (model.KVEntry, error)
	SearchKVEntries(ctx context.Context, guildID string, pattern string) ([]model.KVEntry, error)
	CountKVEntries(ctx context.Context, guildID string) (int, error)
}

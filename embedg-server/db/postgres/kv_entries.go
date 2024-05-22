package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"gopkg.in/guregu/null.v4"
)

func (s *PostgresStore) GetKVEntry(ctx context.Context, guildID string, key string) (model.KVEntry, error) {
	row, err := s.Q.GetKVEntry(ctx, pgmodel.GetKVEntryParams{
		GuildID: guildID,
		Key:     key,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return model.KVEntry{}, store.ErrNotFound
		}
		return model.KVEntry{}, err
	}

	return rowToKVEntry(row), nil
}

func (s *PostgresStore) SetKVEntry(ctx context.Context, entry model.KVEntry) error {
	err := s.Q.SetKVEntry(ctx, pgmodel.SetKVEntryParams{
		Key:     entry.Key,
		GuildID: entry.GuildID,
		Value:   entry.Value,
		ExpiresAt: sql.NullTime{
			Time:  entry.ExpiresAt.Time,
			Valid: entry.ExpiresAt.Valid,
		},
		CreatedAt: entry.CreatedAt,
		UpdatedAt: entry.UpdatedAt,
	})
	return err
}

func (s *PostgresStore) IncreaseKVEntry(ctx context.Context, params model.KVEntryIncreaseParams) (model.KVEntry, error) {
	row, err := s.Q.IncreaseKVEntry(ctx, pgmodel.IncreaseKVEntryParams{
		Key:     params.Key,
		GuildID: params.GuildID,
		Value:   fmt.Sprintf("%d", params.Delta),
		ExpiresAt: sql.NullTime{
			Time:  params.ExpiresAt.Time,
			Valid: params.ExpiresAt.Valid,
		},
		CreatedAt: params.CreatedAt,
		UpdatedAt: params.UpdatedAt,
	})
	if err != nil {
		return model.KVEntry{}, err
	}

	return rowToKVEntry(row), nil

}

func (s *PostgresStore) DeleteKVEntry(ctx context.Context, guildID string, key string) (model.KVEntry, error) {
	row, err := s.Q.DeleteKVEntry(ctx, pgmodel.DeleteKVEntryParams{
		GuildID: guildID,
		Key:     key,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return model.KVEntry{}, store.ErrNotFound
		}
		return model.KVEntry{}, err
	}

	return rowToKVEntry(row), nil
}

func (s *PostgresStore) SearchKVEntries(ctx context.Context, guildID string, pattern string) ([]model.KVEntry, error) {
	rows, err := s.Q.SearchKVEntries(ctx, pgmodel.SearchKVEntriesParams{
		GuildID: guildID,
		Key:     pattern,
	})
	if err != nil {
		return nil, err
	}

	entries := make([]model.KVEntry, len(rows))
	for i, row := range rows {
		entries[i] = rowToKVEntry(row)
	}

	return entries, nil
}
func (s *PostgresStore) CountKVEntries(ctx context.Context, guildID string) (int, error) {
	count, err := s.Q.CountKVEntries(ctx, guildID)
	if err != nil {
		return 0, err
	}

	return int(count), nil
}

func rowToKVEntry(row pgmodel.KvEntry) model.KVEntry {
	return model.KVEntry{
		Key:       row.Key,
		GuildID:   row.GuildID,
		Value:     row.Value,
		ExpiresAt: null.NewTime(row.ExpiresAt.Time, row.ExpiresAt.Valid),
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
	}
}

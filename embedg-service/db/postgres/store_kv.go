package postgres

import (
	"context"
	"errors"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"gopkg.in/guregu/null.v4"
)

var _ store.KVEntryStore = (*Client)(nil)

func (c *Client) GetKVEntry(ctx context.Context, guildID common.ID, key string) (*model.KVEntry, error) {
	row, err := c.Q.GetKVEntry(ctx, pgmodel.GetKVEntryParams{
		Key:     key,
		GuildID: guildID.String(),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToKVEntry(row), nil
}

func (c *Client) SetKVEntry(ctx context.Context, entry model.KVEntry) error {
	err := c.Q.SetKVEntry(ctx, pgmodel.SetKVEntryParams{
		Key:       entry.Key,
		GuildID:   entry.GuildID.String(),
		Value:     entry.Value,
		ExpiresAt: pgtype.Timestamp{Time: entry.ExpiresAt.Time, Valid: entry.ExpiresAt.Valid},
		CreatedAt: pgtype.Timestamp{Time: entry.CreatedAt, Valid: true},
		UpdatedAt: pgtype.Timestamp{Time: entry.UpdatedAt, Valid: true},
	})
	return err
}

func (c *Client) IncreaseKVEntry(ctx context.Context, params store.KVEntryIncreaseParams) (*model.KVEntry, error) {
	row, err := c.Q.IncreaseKVEntry(ctx, pgmodel.IncreaseKVEntryParams{
		Key:       params.Key,
		GuildID:   params.GuildID.String(),
		Value:     strconv.Itoa(params.Delta),
		ExpiresAt: pgtype.Timestamp{Time: params.ExpiresAt.Time, Valid: params.ExpiresAt.Valid},
		CreatedAt: pgtype.Timestamp{Time: params.CreatedAt, Valid: true},
		UpdatedAt: pgtype.Timestamp{Time: params.UpdatedAt, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return rowToKVEntry(row), nil
}

func (c *Client) DeleteKVEntry(ctx context.Context, guildID common.ID, key string) (*model.KVEntry, error) {
	row, err := c.Q.DeleteKVEntry(ctx, pgmodel.DeleteKVEntryParams{
		Key:     key,
		GuildID: guildID.String(),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToKVEntry(row), nil
}

func (c *Client) SearchKVEntries(ctx context.Context, guildID common.ID, pattern string) ([]model.KVEntry, error) {
	rows, err := c.Q.SearchKVEntries(ctx, pgmodel.SearchKVEntriesParams{
		Key:     pattern,
		GuildID: guildID.String(),
	})
	if err != nil {
		return nil, err
	}
	return rowsToKVEntries(rows), nil
}

func (c *Client) CountKVEntries(ctx context.Context, guildID common.ID) (int64, error) {
	count, err := c.Q.CountKVEntries(ctx, guildID.String())
	if err != nil {
		return 0, err
	}
	return count, nil
}

func rowsToKVEntries(rows []pgmodel.KvEntry) []model.KVEntry {
	entries := make([]model.KVEntry, len(rows))
	for i, row := range rows {
		entries[i] = *rowToKVEntry(row)
	}
	return entries
}

func rowToKVEntry(row pgmodel.KvEntry) *model.KVEntry {
	return &model.KVEntry{
		Key:       row.Key,
		GuildID:   common.DefinitelyID(row.GuildID),
		Value:     row.Value,
		ExpiresAt: null.NewTime(row.ExpiresAt.Time, row.ExpiresAt.Valid),
		CreatedAt: row.CreatedAt.Time,
		UpdatedAt: row.UpdatedAt.Time,
	}
}

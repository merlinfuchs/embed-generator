package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

var _ store.SharedMessageStore = (*Client)(nil)

func (c *Client) CreateSharedMessage(ctx context.Context, msg model.SharedMessage) (*model.SharedMessage, error) {
	row, err := c.Q.InsertSharedMessage(ctx, pgmodel.InsertSharedMessageParams{
		ID:        msg.ID,
		CreatedAt: pgtype.Timestamp{Time: msg.CreatedAt, Valid: true},
		ExpiresAt: pgtype.Timestamp{Time: msg.ExpiresAt, Valid: true},
		Data:      msg.Data,
	})
	if err != nil {
		return nil, err
	}
	return rowToSharedMessage(row), nil
}

func (c *Client) GetSharedMessage(ctx context.Context, id string) (*model.SharedMessage, error) {
	row, err := c.Q.GetSharedMessage(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToSharedMessage(row), nil
}

func (c *Client) DeleteExpiredSharedMessages(ctx context.Context, now time.Time) error {
	err := c.Q.DeleteExpiredSharedMessages(ctx, pgtype.Timestamp{Time: now, Valid: true})
	return err
}

func rowToSharedMessage(row pgmodel.SharedMessage) *model.SharedMessage {
	return &model.SharedMessage{
		ID:        row.ID,
		CreatedAt: row.CreatedAt.Time,
		ExpiresAt: row.ExpiresAt.Time,
		Data:      row.Data,
	}
}

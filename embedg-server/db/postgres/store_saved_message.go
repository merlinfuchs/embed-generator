package postgres

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"gopkg.in/guregu/null.v4"
)

var _ store.SavedMessageStore = (*Client)(nil)

func (c *Client) CreateSavedMessage(ctx context.Context, msg model.SavedMessage) (*model.SavedMessage, error) {
	row, err := c.Q.InsertSavedMessage(ctx, pgmodel.InsertSavedMessageParams{
		ID:          msg.ID,
		CreatorID:   msg.CreatorID.String(),
		GuildID:     pgtype.Text{String: msg.GuildID.ID.String(), Valid: msg.GuildID.Valid},
		UpdatedAt:   pgtype.Timestamp{Time: msg.UpdatedAt, Valid: true},
		Name:        msg.Name,
		Description: pgtype.Text{String: msg.Description.String, Valid: msg.Description.Valid},
		Data:        msg.Data,
	})
	if err != nil {
		return nil, err
	}
	return rowToSavedMessage(row), nil
}

func (c *Client) UpdateSavedMessageForCreator(ctx context.Context, msg model.SavedMessage, keepVersions int) (*model.SavedMessage, error) {
	return c.updateSavedMessage(ctx, msg, keepVersions,
		func(q *pgmodel.Queries) (int64, error) {
			return q.InsertSavedMessageVersionForCreator(ctx, pgmodel.InsertSavedMessageVersionForCreatorParams{
				ID:             common.InternalID(),
				SavedMessageID: msg.ID,
				CreatorID:      msg.CreatorID.String(),
				NewData:        msg.Data,
			})
		},
		func(q *pgmodel.Queries) (pgmodel.SavedMessage, error) {
			return q.UpdateSavedMessageForCreator(ctx, pgmodel.UpdateSavedMessageForCreatorParams{
				ID:          msg.ID,
				CreatorID:   msg.CreatorID.String(),
				UpdatedAt:   pgtype.Timestamp{Time: msg.UpdatedAt, Valid: true},
				Name:        msg.Name,
				Description: pgtype.Text{String: msg.Description.String, Valid: msg.Description.Valid},
				Data:        msg.Data,
			})
		},
	)
}

func (c *Client) UpdateSavedMessageForGuild(ctx context.Context, msg model.SavedMessage, keepVersions int) (*model.SavedMessage, error) {
	guildID := pgtype.Text{String: msg.GuildID.ID.String(), Valid: msg.GuildID.Valid}
	return c.updateSavedMessage(ctx, msg, keepVersions,
		func(q *pgmodel.Queries) (int64, error) {
			return q.InsertSavedMessageVersionForGuild(ctx, pgmodel.InsertSavedMessageVersionForGuildParams{
				ID:             common.InternalID(),
				SavedMessageID: msg.ID,
				GuildID:        guildID,
				NewData:        msg.Data,
			})
		},
		func(q *pgmodel.Queries) (pgmodel.SavedMessage, error) {
			return q.UpdateSavedMessageForGuild(ctx, pgmodel.UpdateSavedMessageForGuildParams{
				ID:          msg.ID,
				GuildID:     guildID,
				UpdatedAt:   pgtype.Timestamp{Time: msg.UpdatedAt, Valid: true},
				Name:        msg.Name,
				Description: pgtype.Text{String: msg.Description.String, Valid: msg.Description.Valid},
				Data:        msg.Data,
			})
		},
	)
}

// updateSavedMessage keeps what the message looked like as a version, updates it and deletes the
// versions past keepVersions, all in one transaction.
func (c *Client) updateSavedMessage(
	ctx context.Context,
	msg model.SavedMessage,
	keepVersions int,
	insertVersion func(q *pgmodel.Queries) (int64, error),
	update func(q *pgmodel.Queries) (pgmodel.SavedMessage, error),
) (*model.SavedMessage, error) {
	tx, err := c.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	q := c.Q.WithTx(tx)

	var inserted int64
	if msg.Data != nil && keepVersions > 0 {
		if inserted, err = insertVersion(q); err != nil {
			return nil, err
		}
	}

	row, err := update(q)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}

	// Versions past the plan stay hidden instead of deleted until the next one is kept, so a lapsed
	// plan doesn't lose them.
	if inserted > 0 {
		if err := q.DeleteOldSavedMessageVersions(ctx, pgmodel.DeleteOldSavedMessageVersionsParams{
			SavedMessageID: msg.ID,
			KeepCount:      int32(keepVersions),
		}); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return rowToSavedMessage(row), nil
}

func (c *Client) DeleteSavedMessageForCreator(ctx context.Context, creatorID common.ID, id string) error {
	err := c.Q.DeleteSavedMessageForCreator(ctx, pgmodel.DeleteSavedMessageForCreatorParams{
		ID:        id,
		CreatorID: creatorID.String(),
	})
	return err
}

func (c *Client) DeleteSavedMessageForGuild(ctx context.Context, guildID common.ID, id string) error {
	err := c.Q.DeleteSavedMessageForGuild(ctx, pgmodel.DeleteSavedMessageForGuildParams{
		ID:      id,
		GuildID: pgtype.Text{String: guildID.String(), Valid: true},
	})
	return err
}

func (c *Client) GetSavedMessagesForCreator(ctx context.Context, creatorID common.ID) ([]model.SavedMessage, error) {
	rows, err := c.Q.GetSavedMessagesForCreator(ctx, creatorID.String())
	if err != nil {
		return nil, err
	}
	return rowsToSavedMessages(rows), nil
}

func (c *Client) GetSavedMessagesForGuild(ctx context.Context, guildID common.ID) ([]model.SavedMessage, error) {
	rows, err := c.Q.GetSavedMessagesForGuild(ctx, pgtype.Text{String: guildID.String(), Valid: true})
	if err != nil {
		return nil, err
	}
	return rowsToSavedMessages(rows), nil
}

func (c *Client) CountSavedMessagesForCreator(ctx context.Context, creatorID common.ID) (int64, error) {
	return c.Q.CountSavedMessagesForCreator(ctx, creatorID.String())
}

func (c *Client) CountSavedMessagesForGuild(ctx context.Context, guildID common.ID) (int64, error) {
	return c.Q.CountSavedMessagesForGuild(ctx, pgtype.Text{String: guildID.String(), Valid: true})
}

func (c *Client) GetSavedMessageForGuild(ctx context.Context, guildID common.ID, id string) (*model.SavedMessage, error) {
	row, err := c.Q.GetSavedMessageForGuild(ctx, pgmodel.GetSavedMessageForGuildParams{
		GuildID: pgtype.Text{String: guildID.String(), Valid: true},
		ID:      id,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToSavedMessage(row), nil
}

func (c *Client) GetSavedMessageNamesForGuild(ctx context.Context, guildID common.ID, limit int) ([]model.SavedMessage, error) {
	rows, err := c.Q.GetSavedMessageNamesForGuild(ctx, pgmodel.GetSavedMessageNamesForGuildParams{
		GuildID:  pgtype.Text{String: guildID.String(), Valid: true},
		MaxCount: int32(limit),
	})
	if err != nil {
		return nil, err
	}

	messages := make([]model.SavedMessage, len(rows))
	for i, row := range rows {
		messages[i] = model.SavedMessage{ID: row.ID, Name: row.Name}
	}
	return messages, nil
}

func rowsToSavedMessages(rows []pgmodel.SavedMessage) []model.SavedMessage {
	messages := make([]model.SavedMessage, len(rows))
	for i, row := range rows {
		messages[i] = *rowToSavedMessage(row)
	}
	return messages
}

func rowToSavedMessage(row pgmodel.SavedMessage) *model.SavedMessage {
	var guildID common.NullID
	if row.GuildID.Valid {
		guildID = common.NullID{
			Valid: true,
			ID:    common.DefinitelyID(row.GuildID.String),
		}
	}

	var data json.RawMessage
	if row.Data != nil {
		data = json.RawMessage(row.Data)
	}

	return &model.SavedMessage{
		ID:          row.ID,
		CreatorID:   common.DefinitelyID(row.CreatorID),
		GuildID:     guildID,
		UpdatedAt:   row.UpdatedAt.Time,
		Name:        row.Name,
		Description: null.NewString(row.Description.String, row.Description.Valid),
		Data:        data,
	}
}

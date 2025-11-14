package postgres

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
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

func (c *Client) UpdateSavedMessageForCreator(ctx context.Context, msg model.SavedMessage) (*model.SavedMessage, error) {
	row, err := c.Q.UpdateSavedMessageForCreator(ctx, pgmodel.UpdateSavedMessageForCreatorParams{
		ID:          msg.ID,
		CreatorID:   msg.CreatorID.String(),
		UpdatedAt:   pgtype.Timestamp{Time: msg.UpdatedAt, Valid: true},
		Name:        msg.Name,
		Description: pgtype.Text{String: msg.Description.String, Valid: msg.Description.Valid},
		Data:        msg.Data,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToSavedMessage(row), nil
}

func (c *Client) UpdateSavedMessageForGuild(ctx context.Context, msg model.SavedMessage) (*model.SavedMessage, error) {
	row, err := c.Q.UpdateSavedMessageForGuild(ctx, pgmodel.UpdateSavedMessageForGuildParams{
		ID:          msg.ID,
		GuildID:     pgtype.Text{String: msg.GuildID.ID.String(), Valid: msg.GuildID.Valid},
		UpdatedAt:   pgtype.Timestamp{Time: msg.UpdatedAt, Valid: true},
		Name:        msg.Name,
		Description: pgtype.Text{String: msg.Description.String, Valid: msg.Description.Valid},
		Data:        msg.Data,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
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

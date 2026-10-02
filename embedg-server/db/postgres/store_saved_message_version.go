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
)

func (c *Client) CreateSavedMessageVersionForCreator(ctx context.Context, versionID string, msg model.SavedMessage) error {
	return c.Q.InsertSavedMessageVersionForCreator(ctx, pgmodel.InsertSavedMessageVersionForCreatorParams{
		ID:             versionID,
		SavedMessageID: msg.ID,
		CreatorID:      msg.CreatorID.String(),
		NewData:        msg.Data,
	})
}

func (c *Client) CreateSavedMessageVersionForGuild(ctx context.Context, versionID string, msg model.SavedMessage) error {
	return c.Q.InsertSavedMessageVersionForGuild(ctx, pgmodel.InsertSavedMessageVersionForGuildParams{
		ID:             versionID,
		SavedMessageID: msg.ID,
		GuildID:        pgtype.Text{String: msg.GuildID.ID.String(), Valid: msg.GuildID.Valid},
		NewData:        msg.Data,
	})
}

func (c *Client) DeleteOldSavedMessageVersions(ctx context.Context, messageID string, keep int) error {
	return c.Q.DeleteOldSavedMessageVersions(ctx, pgmodel.DeleteOldSavedMessageVersionsParams{
		SavedMessageID: messageID,
		KeepCount:      int32(keep),
	})
}

func (c *Client) GetSavedMessageVersionsForCreator(ctx context.Context, creatorID common.ID, messageID string, limit int) ([]model.SavedMessageVersion, error) {
	rows, err := c.Q.GetSavedMessageVersionsForCreator(ctx, pgmodel.GetSavedMessageVersionsForCreatorParams{
		SavedMessageID: messageID,
		CreatorID:      creatorID.String(),
		MaxCount:       int32(limit),
	})
	if err != nil {
		return nil, err
	}

	versions := make([]model.SavedMessageVersion, len(rows))
	for i, row := range rows {
		versions[i] = model.SavedMessageVersion{
			ID:             row.ID,
			SavedMessageID: messageID,
			CreatedAt:      row.CreatedAt.Time,
			Name:           row.Name,
		}
	}
	return versions, nil
}

func (c *Client) GetSavedMessageVersionsForGuild(ctx context.Context, guildID common.ID, messageID string, limit int) ([]model.SavedMessageVersion, error) {
	rows, err := c.Q.GetSavedMessageVersionsForGuild(ctx, pgmodel.GetSavedMessageVersionsForGuildParams{
		SavedMessageID: messageID,
		GuildID:        pgtype.Text{String: guildID.String(), Valid: true},
		MaxCount:       int32(limit),
	})
	if err != nil {
		return nil, err
	}

	versions := make([]model.SavedMessageVersion, len(rows))
	for i, row := range rows {
		versions[i] = model.SavedMessageVersion{
			ID:             row.ID,
			SavedMessageID: messageID,
			CreatedAt:      row.CreatedAt.Time,
			Name:           row.Name,
		}
	}
	return versions, nil
}

func (c *Client) GetSavedMessageVersionForCreator(ctx context.Context, creatorID common.ID, messageID string, versionID string, limit int) (*model.SavedMessageVersion, error) {
	row, err := c.Q.GetSavedMessageVersionForCreator(ctx, pgmodel.GetSavedMessageVersionForCreatorParams{
		ID:             versionID,
		SavedMessageID: messageID,
		CreatorID:      creatorID.String(),
		MaxCount:       int32(limit),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToSavedMessageVersion(row), nil
}

func (c *Client) GetSavedMessageVersionForGuild(ctx context.Context, guildID common.ID, messageID string, versionID string, limit int) (*model.SavedMessageVersion, error) {
	row, err := c.Q.GetSavedMessageVersionForGuild(ctx, pgmodel.GetSavedMessageVersionForGuildParams{
		ID:             versionID,
		SavedMessageID: messageID,
		GuildID:        pgtype.Text{String: guildID.String(), Valid: true},
		MaxCount:       int32(limit),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToSavedMessageVersion(row), nil
}

func rowToSavedMessageVersion(row pgmodel.SavedMessageVersion) *model.SavedMessageVersion {
	return &model.SavedMessageVersion{
		ID:             row.ID,
		SavedMessageID: row.SavedMessageID,
		CreatedAt:      row.CreatedAt.Time,
		Name:           row.Name,
		Data:           json.RawMessage(row.Data),
	}
}

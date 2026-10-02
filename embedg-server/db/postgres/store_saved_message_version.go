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
			ID:        row.ID,
			CreatedAt: row.CreatedAt.Time,
			Name:      row.Name,
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
			ID:        row.ID,
			CreatedAt: row.CreatedAt.Time,
			Name:      row.Name,
		}
	}
	return versions, nil
}

func (c *Client) GetSavedMessageVersionForCreator(ctx context.Context, creatorID common.ID, messageID string, versionID string) (*model.SavedMessageVersion, error) {
	row, err := c.Q.GetSavedMessageVersionForCreator(ctx, pgmodel.GetSavedMessageVersionForCreatorParams{
		ID:             versionID,
		SavedMessageID: messageID,
		CreatorID:      creatorID.String(),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToSavedMessageVersion(row), nil
}

func (c *Client) GetSavedMessageVersionForGuild(ctx context.Context, guildID common.ID, messageID string, versionID string) (*model.SavedMessageVersion, error) {
	row, err := c.Q.GetSavedMessageVersionForGuild(ctx, pgmodel.GetSavedMessageVersionForGuildParams{
		ID:             versionID,
		SavedMessageID: messageID,
		GuildID:        pgtype.Text{String: guildID.String(), Valid: true},
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
		ID:        row.ID,
		CreatedAt: row.CreatedAt.Time,
		Name:      row.Name,
		Data:      json.RawMessage(row.Data),
	}
}

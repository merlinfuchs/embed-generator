package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

var _ store.ImageStore = (*Client)(nil)

func (c *Client) CreateImage(ctx context.Context, img model.Image) error {
	_, err := c.Q.InsertImage(ctx, pgmodel.InsertImageParams{
		ID:              img.ID,
		GuildID:         pgtype.Text{String: img.GuildID.ID.String(), Valid: img.GuildID.Valid},
		UserID:          img.UserID.String(),
		FileHash:        img.FileHash,
		FileName:        img.FileName,
		FileContentType: img.FileContentType,
		FileSize:        int32(img.FileSize),
		S3Key:           img.S3Key,
	})
	return err
}

func (c *Client) GetImage(ctx context.Context, id string) (*model.Image, error) {
	row, err := c.Q.GetImage(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToImage(row), nil
}

func rowToImage(row pgmodel.Image) *model.Image {
	var guildID common.NullID
	if row.GuildID.Valid {
		guildID = common.NullID{
			Valid: true,
			ID:    common.DefinitelyID(row.GuildID.String),
		}
	}

	return &model.Image{
		ID:              row.ID,
		UserID:          common.DefinitelyID(row.UserID),
		GuildID:         guildID,
		FileHash:        row.FileHash,
		FileName:        row.FileName,
		FileSize:        int(row.FileSize),
		FileContentType: row.FileContentType,
		S3Key:           row.S3Key,
	}
}

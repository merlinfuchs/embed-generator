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
	"gopkg.in/guregu/null.v4"
)

var _ store.EmbedLinkStore = (*Client)(nil)

func (c *Client) CreateEmbedLink(ctx context.Context, embedLink model.EmbedLink) (*model.EmbedLink, error) {
	row, err := c.Q.InsertEmbedLink(ctx, pgmodel.InsertEmbedLinkParams{
		ID:             embedLink.ID.String(),
		Url:            embedLink.Url,
		ThemeColor:     pgtype.Text{String: embedLink.ThemeColor.String, Valid: embedLink.ThemeColor.Valid},
		OgTitle:        pgtype.Text{String: embedLink.OgTitle.String, Valid: embedLink.OgTitle.Valid},
		OgSiteName:     pgtype.Text{String: embedLink.OgSiteName.String, Valid: embedLink.OgSiteName.Valid},
		OgDescription:  pgtype.Text{String: embedLink.OgDescription.String, Valid: embedLink.OgDescription.Valid},
		OgImage:        pgtype.Text{String: embedLink.OgImage.String, Valid: embedLink.OgImage.Valid},
		OeType:         pgtype.Text{String: embedLink.OeType.String, Valid: embedLink.OeType.Valid},
		OeAuthorName:   pgtype.Text{String: embedLink.OeAuthorName.String, Valid: embedLink.OeAuthorName.Valid},
		OeAuthorUrl:    pgtype.Text{String: embedLink.OeAuthorUrl.String, Valid: embedLink.OeAuthorUrl.Valid},
		OeProviderName: pgtype.Text{String: embedLink.OeProviderName.String, Valid: embedLink.OeProviderName.Valid},
		OeProviderUrl:  pgtype.Text{String: embedLink.OeProviderUrl.String, Valid: embedLink.OeProviderUrl.Valid},
		TwCard:         pgtype.Text{String: embedLink.TwCard.String, Valid: embedLink.TwCard.Valid},
		ExpiresAt:      pgtype.Timestamp{Time: embedLink.ExpiresAt.Time, Valid: embedLink.ExpiresAt.Valid},
		CreatedAt:      pgtype.Timestamp{Time: embedLink.CreatedAt, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return rowToEmbedLink(row), nil
}

func (c *Client) GetEmbedLink(ctx context.Context, id string) (*model.EmbedLink, error) {
	row, err := c.Q.GetEmbedLink(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToEmbedLink(row), nil
}

func rowToEmbedLink(row pgmodel.EmbedLink) *model.EmbedLink {
	return &model.EmbedLink{
		ID:             common.DefinitelyID(row.ID),
		Url:            row.Url,
		ThemeColor:     null.NewString(row.ThemeColor.String, row.ThemeColor.Valid),
		OgTitle:        null.NewString(row.OgTitle.String, row.OgTitle.Valid),
		OgSiteName:     null.NewString(row.OgSiteName.String, row.OgSiteName.Valid),
		OgDescription:  null.NewString(row.OgDescription.String, row.OgDescription.Valid),
		OgImage:        null.NewString(row.OgImage.String, row.OgImage.Valid),
		OeType:         null.NewString(row.OeType.String, row.OeType.Valid),
		OeAuthorName:   null.NewString(row.OeAuthorName.String, row.OeAuthorName.Valid),
		OeAuthorUrl:    null.NewString(row.OeAuthorUrl.String, row.OeAuthorUrl.Valid),
		OeProviderName: null.NewString(row.OeProviderName.String, row.OeProviderName.Valid),
		OeProviderUrl:  null.NewString(row.OeProviderUrl.String, row.OeProviderUrl.Valid),
		TwCard:         null.NewString(row.TwCard.String, row.TwCard.Valid),
		ExpiresAt:      null.NewTime(row.ExpiresAt.Time, row.ExpiresAt.Valid),
		CreatedAt:      row.CreatedAt.Time,
	}
}

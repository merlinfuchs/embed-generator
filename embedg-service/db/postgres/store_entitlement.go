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

var _ store.EntitlementStore = (*Client)(nil)

func (c *Client) GetActiveEntitlementsForGuild(ctx context.Context, guildID common.ID) ([]model.Entitlement, error) {
	rows, err := c.Q.GetActiveEntitlementsForGuild(ctx, pgtype.Text{String: guildID.String(), Valid: true})
	if err != nil {
		return nil, err
	}
	return rowsToEntitlements(rows), nil
}

func (c *Client) GetActiveEntitlementsForUser(ctx context.Context, userID common.ID) ([]model.Entitlement, error) {
	rows, err := c.Q.GetActiveEntitlementsForUser(ctx, pgtype.Text{String: userID.String(), Valid: true})
	if err != nil {
		return nil, err
	}
	return rowsToEntitlements(rows), nil
}

func (c *Client) GetEntitlements(ctx context.Context) ([]model.Entitlement, error) {
	rows, err := c.Q.GetEntitlements(ctx)
	if err != nil {
		return nil, err
	}
	return rowsToEntitlements(rows), nil
}

func (c *Client) GetEntitlement(ctx context.Context, id common.ID, userID common.ID) (*model.Entitlement, error) {
	row, err := c.Q.GetEntitlement(ctx, pgmodel.GetEntitlementParams{
		ID:     id.String(),
		UserID: pgtype.Text{String: userID.String(), Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToEntitlement(row), nil
}

func (c *Client) UpdateEntitlementConsumedGuildID(ctx context.Context, id common.ID, consumedGuildID common.NullID) (*model.Entitlement, error) {
	row, err := c.Q.UpdateEntitlementConsumedGuildID(ctx, pgmodel.UpdateEntitlementConsumedGuildIDParams{
		ID:              id.String(),
		ConsumedGuildID: pgtype.Text{String: consumedGuildID.ID.String(), Valid: consumedGuildID.Valid},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToEntitlement(row), nil
}

func (c *Client) UpsertEntitlement(ctx context.Context, entitlement model.Entitlement) (*model.Entitlement, error) {
	row, err := c.Q.UpsertEntitlement(ctx, pgmodel.UpsertEntitlementParams{
		ID:        entitlement.ID,
		UserID:    pgtype.Text{String: entitlement.UserID.ID.String(), Valid: entitlement.UserID.Valid},
		GuildID:   pgtype.Text{String: entitlement.GuildID.ID.String(), Valid: entitlement.GuildID.Valid},
		UpdatedAt: pgtype.Timestamp{Time: entitlement.UpdatedAt, Valid: true},
		Deleted:   entitlement.Deleted,
		SkuID:     entitlement.SkuID,
		StartsAt:  pgtype.Timestamp{Time: entitlement.StartsAt.Time, Valid: entitlement.StartsAt.Valid},
		EndsAt:    pgtype.Timestamp{Time: entitlement.EndsAt.Time, Valid: entitlement.EndsAt.Valid},
		Consumed:  entitlement.Consumed,
	})
	if err != nil {
		return nil, err
	}
	return rowToEntitlement(row), nil
}

func rowsToEntitlements(rows []pgmodel.Entitlement) []model.Entitlement {
	entitlements := make([]model.Entitlement, len(rows))
	for i, row := range rows {
		entitlements[i] = *rowToEntitlement(row)
	}
	return entitlements
}

func rowToEntitlement(row pgmodel.Entitlement) *model.Entitlement {
	var userID common.NullID
	if row.UserID.Valid {
		userID = common.NullID{
			Valid: true,
			ID:    common.DefinitelyID(row.UserID.String),
		}
	}

	var guildID common.NullID
	if row.GuildID.Valid {
		guildID = common.NullID{
			Valid: true,
			ID:    common.DefinitelyID(row.GuildID.String),
		}
	}

	return &model.Entitlement{
		ID:              row.ID,
		UserID:          userID,
		GuildID:         guildID,
		UpdatedAt:       row.UpdatedAt.Time,
		Deleted:         row.Deleted,
		SkuID:           row.SkuID,
		StartsAt:        null.NewTime(row.StartsAt.Time, row.StartsAt.Valid),
		EndsAt:          null.NewTime(row.EndsAt.Time, row.EndsAt.Valid),
		Consumed:        row.Consumed,
		ConsumedGuildID: null.NewString(row.ConsumedGuildID.String, row.ConsumedGuildID.Valid),
	}
}

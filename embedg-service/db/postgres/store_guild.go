package postgres

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"gopkg.in/guregu/null.v4"
)

var _ store.GuildStore = (*Client)(nil)

func (c *Client) UpsertGuild(ctx context.Context, guild model.Guild) error {
	return c.Q.UpsertGuild(ctx, pgmodel.UpsertGuildParams{
		ID:       int64(guild.ID),
		Name:     guild.Name,
		Icon:     pgtype.Text{String: guild.Icon.String, Valid: guild.Icon.Valid},
		OwnerID:  int64(guild.OwnerID),
		JoinedAt: pgtype.Timestamp{Time: guild.JoinedAt, Valid: true},
	})
}

func (c *Client) MarkGuildLeft(ctx context.Context, guildID common.ID, now time.Time) error {
	return c.Q.MarkGuildLeft(ctx, pgmodel.MarkGuildLeftParams{
		ID:     int64(guildID),
		LeftAt: pgtype.Timestamp{Time: now, Valid: true},
	})
}

func (c *Client) GetGuilds(ctx context.Context, guildIDs []common.ID) ([]model.Guild, error) {
	ids := make([]int64, len(guildIDs))
	for i, guildID := range guildIDs {
		ids[i] = int64(guildID)
	}

	rows, err := c.Q.GetGuilds(ctx, ids)
	if err != nil {
		return nil, err
	}

	guilds := make([]model.Guild, len(rows))
	for i, row := range rows {
		guilds[i] = *rowToGuild(row)
	}
	return guilds, nil
}

func rowToGuild(row pgmodel.Guild) *model.Guild {
	return &model.Guild{
		ID:        common.ID(row.ID),
		Name:      row.Name,
		Icon:      null.NewString(row.Icon.String, row.Icon.Valid),
		OwnerID:   common.ID(row.OwnerID),
		JoinedAt:  row.JoinedAt.Time,
		LeftAt:    null.NewTime(row.LeftAt.Time, row.LeftAt.Valid),
		UpdatedAt: row.UpdatedAt.Time,
	}
}

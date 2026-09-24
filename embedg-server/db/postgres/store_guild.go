package postgres

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"gopkg.in/guregu/null.v4"
)

var _ store.GuildStore = (*Client)(nil)

// upsertGuildsQuery is hand written because sqlc can't parse multi-argument unnest (the catalog
// only has the single-argument form), and its text[] maps to []string, which can't carry a NULL icon.
const upsertGuildsQuery = `
INSERT INTO guilds (id, name, icon, owner_id, joined_at, left_at, updated_at)
SELECT id, name, icon, owner_id, $5, NULL, $5
FROM unnest($1::bigint[], $2::text[], $3::text[], $4::bigint[]) AS t(id, name, icon, owner_id)
ON CONFLICT (id)
DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    owner_id = EXCLUDED.owner_id,
    -- only moves when the bot rejoins, otherwise the original join time stands
    joined_at = CASE WHEN guilds.left_at IS NOT NULL THEN EXCLUDED.joined_at ELSE guilds.joined_at END,
    left_at = NULL,
    updated_at = EXCLUDED.updated_at
WHERE guilds.name IS DISTINCT FROM EXCLUDED.name
   OR guilds.icon IS DISTINCT FROM EXCLUDED.icon
   OR guilds.owner_id IS DISTINCT FROM EXCLUDED.owner_id
   OR guilds.left_at IS NOT NULL`

func (c *Client) UpsertGuilds(ctx context.Context, guilds []model.Guild, now time.Time) error {
	ids := make([]int64, len(guilds))
	names := make([]string, len(guilds))
	icons := make([]*string, len(guilds))
	ownerIDs := make([]int64, len(guilds))

	for i, guild := range guilds {
		ids[i] = int64(guild.ID)
		names[i] = guild.Name
		icons[i] = guild.Icon.Ptr()
		ownerIDs[i] = int64(guild.OwnerID)
	}

	_, err := c.DB.Exec(ctx, upsertGuildsQuery, ids, names, icons, ownerIDs, now)
	return err
}

func (c *Client) MarkGuildLeft(ctx context.Context, guildID common.ID, now time.Time) error {
	return c.Q.MarkGuildLeft(ctx, pgmodel.MarkGuildLeftParams{
		ID:     int64(guildID),
		LeftAt: pgtype.Timestamp{Time: now, Valid: true},
	})
}

func (c *Client) MarkGuildsLeftOnShard(ctx context.Context, shardID int, shardCount int, keepIDs []common.ID, now time.Time) error {
	ids := make([]int64, len(keepIDs))
	for i, guildID := range keepIDs {
		ids[i] = int64(guildID)
	}

	return c.Q.MarkGuildsLeftOnShard(ctx, pgmodel.MarkGuildsLeftOnShardParams{
		Now:        pgtype.Timestamp{Time: now, Valid: true},
		ShardCount: int64(shardCount),
		ShardID:    int64(shardID),
		KeepIds:    ids,
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

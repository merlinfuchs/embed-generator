package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

type GuildStore interface {
	UpsertGuilds(ctx context.Context, guilds []model.Guild, now time.Time) error
	MarkGuildLeft(ctx context.Context, guildID common.ID, now time.Time) error
	// MarkGuildsLeftOnShard marks every guild on the shard that isn't in keepIDs as left. Rows
	// updated at or after now are left alone, they were joined while the reconcile ran.
	MarkGuildsLeftOnShard(ctx context.Context, shardID int, shardCount int, keepIDs []common.ID, now time.Time) error
	// GetGuilds only returns guilds that the bot is still in.
	GetGuilds(ctx context.Context, guildIDs []common.ID) ([]model.Guild, error)
}

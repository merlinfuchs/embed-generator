package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type GuildStore interface {
	UpsertGuild(ctx context.Context, guild model.Guild) error
	MarkGuildLeft(ctx context.Context, guildID common.ID, now time.Time) error
	// GetGuilds only returns guilds that the bot is still in.
	GetGuilds(ctx context.Context, guildIDs []common.ID) ([]model.Guild, error)
}

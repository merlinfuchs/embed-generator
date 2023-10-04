package bot

import (
	"context"
	"database/sql"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"gopkg.in/guregu/null.v4"
)

type Entitlement struct {
	ID       string    `json:"id"`
	SKUID    string    `json:"sku_id"`
	UserID   string    `json:"user_id"`
	GuildID  string    `json:"guild_id"`
	Deleted  bool      `json:"deleted"`
	StartsAt null.Time `json:"starts_at"`
	EndsAt   null.Time `json:"ends_at"`
}

func (b *Bot) HandleEntitlementEvent(e *Entitlement) {
	_, err := b.pg.Q.UpsertEntitlement(context.Background(), postgres.UpsertEntitlementParams{
		ID: e.ID,
		UserID: sql.NullString{
			String: e.UserID,
			Valid:  e.UserID != "",
		},
		GuildID: sql.NullString{
			String: e.GuildID,
			Valid:  e.GuildID != "",
		},
		UpdatedAt: time.Now().UTC(),
		Deleted:   e.Deleted,
		SkuID:     e.SKUID,
		StartsAt:  e.StartsAt.NullTime,
		EndsAt:    e.EndsAt.NullTime,
	})
	if err != nil {
		log.Error().Err(err).Str("guild_id", e.GuildID).Str("user_id", e.UserID).Msg("Failed to create entitlement")
	}
}

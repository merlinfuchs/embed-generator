package bot

import (
	"context"
	"database/sql"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
)

type Entitlement struct {
	ID       string    `json:"id"`
	SKUID    string    `json:"sku_id"`
	UserID   string    `json:"user_id"`
	GuildID  string    `json:"guild_id"`
	Deleted  bool      `json:"deleted"`
	StartsAt time.Time `json:"starts_at"`
	EndsAt   time.Time `json:"ends_at"`
}

func (b *Bot) HandleEntitlementEvent(e *Entitlement) {
	if e.GuildID == "" {
		log.Warn().Msg("Non guild entitlment received")
		return
	}

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
		StartsAt:  e.StartsAt,
		EndsAt:    e.EndsAt,
	})
	if err != nil {
		log.Error().Err(err).Str("guild_id", e.GuildID).Str("user_id", e.UserID).Msg("Failed to create entitlement")
	}
}

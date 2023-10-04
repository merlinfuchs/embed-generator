package bot

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"gopkg.in/guregu/null.v4"
)

type Entitlement struct {
	ID       string    `json:"id"`
	UserID   string    `json:"user_id"`
	GuildID  string    `json:"guild_id"`
	SKUID    string    `json:"sku_id"`
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

func (b *Bot) lazyTierTask() {
	for {
		err := b.retrieveDiscordTiers(context.Background())
		if err != nil {
			log.Error().Err(err).Msg("Failed to retrieve discord tiers")
		}

		time.Sleep(time.Minute)
	}
}

func (b *Bot) retrieveDiscordTiers(ctx context.Context) error {
	clientID := viper.GetString("discord.client_id")

	after := "0"
	for {
		url := fmt.Sprintf("https://discord.com/api/v10/applications/%s/entitlements?limit=100&after=%s&exclude_ended=true", clientID, after)

		resp, err := b.Session.Request("GET", url, nil)
		if err != nil {
			return fmt.Errorf("Failed to do request: %w", err)
		}

		entitlements := []Entitlement{}
		err = json.Unmarshal(resp, &entitlements)
		if err != nil {
			return fmt.Errorf("Failed to decode response body: %w", err)
		}

		if len(entitlements) == 0 {
			break
		}

		for _, e := range entitlements {
			after = e.ID

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
	}

	return nil
}

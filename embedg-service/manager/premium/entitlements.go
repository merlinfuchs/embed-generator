package premium

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"gopkg.in/guregu/null.v4"
)

func (m *PremiumManager) handleEntitlement(entitlement discord.Entitlement) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var userID common.NullID
	if entitlement.UserID != nil {
		userID = common.NullID{ID: *entitlement.UserID, Valid: true}
	}

	var guildID common.NullID
	if entitlement.GuildID != nil {
		guildID = common.NullID{ID: *entitlement.GuildID, Valid: true}
	}

	var consumed bool
	if entitlement.Consumed != nil {
		consumed = *entitlement.Consumed
	}

	_, err := m.entitlementStore.UpsertEntitlement(ctx, model.Entitlement{
		ID:        entitlement.ID.String(),
		UserID:    userID,
		GuildID:   guildID,
		UpdatedAt: time.Now().UTC(),
		Deleted:   entitlement.Deleted,
		SkuID:     entitlement.SkuID,
		StartsAt:  null.TimeFromPtr(entitlement.StartsAt),
		EndsAt:    null.TimeFromPtr(entitlement.EndsAt),
		Consumed:  consumed,
	})
	if err != nil {
		slog.Error(
			"Failed to upsert entitlement",
			slog.String("entitlement_id", entitlement.ID.String()),
			slog.Any("error", err),
		)
	}
}

func (m *PremiumManager) SyncEntitlements(ctx context.Context) error {
	var after int
	for {
		entitlements, err := m.rest.GetEntitlements(m.appContext.ApplicationID(), rest.GetEntitlementsParams{
			Limit: 100,
			After: after,
		}, rest.WithCtx(ctx))
		if err != nil {
			return fmt.Errorf("failed to get entitlements: %w", err)
		}

		if len(entitlements) == 0 {
			break
		}

		for _, entitlement := range entitlements {
			m.handleEntitlement(entitlement)
			after = int(entitlement.ID)
		}
	}
	return nil
}

func (m *PremiumManager) OnEvent(event bot.Event) {
	switch e := event.(type) {
	case *events.EntitlementCreate:
		m.handleEntitlement(e.Entitlement)
	case *events.EntitlementUpdate:
		m.handleEntitlement(e.Entitlement)
	case *events.EntitlementDelete:
		m.handleEntitlement(e.Entitlement)
	}
}

package premium

import (
	"database/sql"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/premium"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"gopkg.in/guregu/null.v4"
)

type PremiumHandler struct {
	pg   *postgres.PostgresStore
	bot  *bot.Bot
	am   *access.AccessManager
	prem *premium.PremiumManager
}

func New(pg *postgres.PostgresStore, bot *bot.Bot, am *access.AccessManager, prem *premium.PremiumManager) *PremiumHandler {
	return &PremiumHandler{
		pg:   pg,
		bot:  bot,
		am:   am,
		prem: prem,
	}
}

func (h *PremiumHandler) HandleGetFeatures(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	guildID := c.Query("guild_id")

	var features premium.PlanFeatures
	var err error

	if guildID != "" {
		if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
			return err
		}
		features, err = h.prem.GetPlanFeaturesForGuild(c.Context(), guildID)
	} else {
		features, err = h.prem.GetPlanFeaturesForUser(c.Context(), session.UserID)
	}

	if err != nil {
		log.Error().Err(err).Msg("Failed to get premium plan features")
		return err
	}

	return c.JSON(wire.GetPremiumPlanFeaturesResponseWire{
		Success: true,
		Data: wire.GetPremiumPlanFeaturesResponseDataWire{
			MaxSavedMessages:       features.MaxSavedMessages,
			MaxActionsPerComponent: features.MaxActionsPerComponent,
			AdvancedActionTypes:    features.AdvancedActionTypes,
			AIAssistant:            features.AIAssistant,
			IsPremium:              features.IsPremium,
		},
	})
}

func (h *PremiumHandler) HandleListEntitlements(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	guildID := c.Query("guild_id")

	var entitlements []postgres.Entitlement
	var err error

	if guildID != "" {
		if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
			return err
		}
		entitlements, err = h.pg.Q.GetActiveEntitlementsForGuild(c.Context(), sql.NullString{String: guildID, Valid: true})
	} else {
		entitlements, err = h.pg.Q.GetActiveEntitlementsForUser(c.Context(), sql.NullString{String: session.UserID, Valid: true})
	}

	if err != nil {
		log.Error().Err(err).Msg("Failed to get premium entitlements")
		return err
	}

	resp := wire.ListPremiumEntitlementsResponseDataWire{
		Entitlements: make([]wire.PremiumEntitlementWire, len(entitlements)),
	}
	for i, e := range entitlements {
		resp.Entitlements[i] = wire.PremiumEntitlementWire{
			ID:        e.ID,
			SkuID:     e.ID,
			UserID:    null.NewString(e.UserID.String, e.UserID.Valid),
			GuildID:   null.NewString(e.GuildID.String, e.GuildID.Valid),
			UpdatedAt: e.UpdatedAt,
			Deleted:   e.Deleted,
			StartsAt:  null.Time{NullTime: e.StartsAt},
			EndsAt:    null.Time{NullTime: e.EndsAt},
		}
	}

	return c.JSON(wire.ListPremiumEntitlementsResponseWire{
		Success: true,
		Data:    resp,
	})
}

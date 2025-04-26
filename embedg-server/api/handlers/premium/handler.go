package premium

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"gopkg.in/guregu/null.v4"
)

type PremiumHandler struct {
	pg        *postgres.PostgresStore
	bot       *bot.Bot
	am        *access.AccessManager
	planStore store.PlanStore
}

func New(pg *postgres.PostgresStore, bot *bot.Bot, am *access.AccessManager, planStore store.PlanStore) *PremiumHandler {
	return &PremiumHandler{
		pg:        pg,
		bot:       bot,
		am:        am,
		planStore: planStore,
	}
}

func (h *PremiumHandler) HandleGetFeatures(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	guildID := c.Query("guild_id")

	var features model.PlanFeatures
	var err error

	if guildID != "" {
		if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
			return err
		}
		features, err = h.planStore.GetPlanFeaturesForGuild(c.Context(), guildID)
	} else {
		features, err = h.planStore.GetPlanFeaturesForUser(c.Context(), session.UserID)
	}

	if err != nil {
		log.Error().Err(err).Msg("Failed to get premium plan features")
		return err
	}

	return c.JSON(wire.GetPremiumPlanFeaturesResponseWire{
		Success: true,
		Data: wire.GetPremiumPlanFeaturesResponseDataWire{
			MaxSavedMessages:          features.MaxSavedMessages,
			MaxActionsPerComponent:    features.MaxActionsPerComponent,
			AdvancedActionTypes:       features.AdvancedActionTypes,
			AIAssistant:               features.AIAssistant,
			CustomBot:                 features.CustomBot,
			ComponentsV2:              features.ComponentsV2,
			MaxCustomCommands:         features.MaxCustomCommands,
			IsPremium:                 features.IsPremium,
			MaxImageUploadSize:        features.MaxImageUploadSize,
			MaxScheduledMessages:      features.MaxScheduledMessages,
			PeriodicScheduledMessages: features.PeriodicScheduledMessages,
		},
	})
}

func (h *PremiumHandler) HandleListEntitlements(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	guildID := c.Query("guild_id")

	var entitlements []pgmodel.Entitlement
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
		consumable := false
		if plan := h.planStore.GetPlanBySKUID(e.SkuID); plan != nil {
			consumable = plan.Consumable
		}

		resp.Entitlements[i] = wire.PremiumEntitlementWire{
			ID:              e.ID,
			SkuID:           e.ID,
			UserID:          null.NewString(e.UserID.String, e.UserID.Valid),
			GuildID:         null.NewString(e.GuildID.String, e.GuildID.Valid),
			UpdatedAt:       e.UpdatedAt,
			Deleted:         e.Deleted,
			StartsAt:        null.Time{NullTime: e.StartsAt},
			EndsAt:          null.Time{NullTime: e.EndsAt},
			Consumable:      consumable,
			Consumed:        e.Consumed,
			ConsumedGuildID: null.NewString(e.ConsumedGuildID.String, e.ConsumedGuildID.Valid),
		}
	}

	return c.JSON(wire.ListPremiumEntitlementsResponseWire{
		Success: true,
		Data:    resp,
	})
}

func (h *PremiumHandler) HandleConsumeEntitlement(c *fiber.Ctx, req wire.ConsumeEntitlementRequestWire) error {
	session := c.Locals("session").(*session.Session)
	entitlementID := c.Params("entitlementID")

	entitlement, err := h.pg.Q.GetEntitlement(c.Context(), pgmodel.GetEntitlementParams{
		ID: entitlementID,
		UserID: sql.NullString{
			String: session.UserID,
			Valid:  true,
		},
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return helpers.NotFound("entitlement_not_found", "Entitlement not found")
		}
		return err
	}

	if entitlement.ConsumedGuildID.Valid {
		return helpers.BadRequest("entitlement_already_consumed", "Entitlement already consumed")
	}

	_, err = h.pg.Q.UpdateEntitlementConsumedGuildID(c.Context(), pgmodel.UpdateEntitlementConsumedGuildIDParams{
		ID: entitlementID,
		ConsumedGuildID: sql.NullString{
			String: req.GuildID,
			Valid:  true,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to update entitlement: %w", err)
	}

	if !entitlement.Consumed {
		clientID := viper.GetString("discord.client_id")
		url := fmt.Sprintf("https://discord.com/api/v10/applications/%s/entitlements/%s/consume", clientID, entitlement.ID)

		_, err := h.bot.Session.Request("POST", url, nil)
		if err != nil {
			return fmt.Errorf("failed to do request: %w", err)
		}
	}

	return c.JSON(wire.ConsumeEntitlementResponseWire{
		Success: true,
	})
}

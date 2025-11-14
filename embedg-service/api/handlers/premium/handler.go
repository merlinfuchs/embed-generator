package premium

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/rs/zerolog/log"
)

type PremiumHandler struct {
	entitlementStore store.EntitlementStore
	rest             rest.Rest
	am               *access.AccessManager
	planStore        store.PlanStore
	appContext       store.AppContext
}

func New(
	entitlementStore store.EntitlementStore,
	rest rest.Rest,
	am *access.AccessManager,
	planStore store.PlanStore,
	appContext store.AppContext,
) *PremiumHandler {
	return &PremiumHandler{
		entitlementStore: entitlementStore,
		rest:             rest,
		am:               am,
		planStore:        planStore,
		appContext:       appContext,
	}
}

func (h *PremiumHandler) HandleGetFeatures(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	guildID, err := handlers.QueryNullID(c, "guild_id")
	if err != nil {
		return err
	}

	var features model.PlanFeatures

	if guildID.Valid {
		if err := h.am.CheckGuildAccessForRequest(c, guildID.ID); err != nil {
			return err
		}
		features, err = h.planStore.GetPlanFeaturesForGuild(c.Context(), guildID.ID)
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
			ComponentTypes:            features.ComponentTypes,
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
	guildID, err := handlers.QueryNullID(c, "guild_id")
	if err != nil {
		return err
	}

	var entitlements []model.Entitlement

	if guildID.Valid {
		if err := h.am.CheckGuildAccessForRequest(c, guildID.ID); err != nil {
			return err
		}
		entitlements, err = h.entitlementStore.GetActiveEntitlementsForGuild(c.Context(), guildID.ID)
	} else {
		entitlements, err = h.entitlementStore.GetActiveEntitlementsForUser(c.Context(), session.UserID)
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
			UserID:          e.UserID,
			GuildID:         e.GuildID,
			UpdatedAt:       e.UpdatedAt,
			Deleted:         e.Deleted,
			StartsAt:        e.StartsAt,
			EndsAt:          e.EndsAt,
			Consumable:      consumable,
			Consumed:        e.Consumed,
			ConsumedGuildID: e.ConsumedGuildID,
		}
	}

	return c.JSON(wire.ListPremiumEntitlementsResponseWire{
		Success: true,
		Data:    resp,
	})
}

func (h *PremiumHandler) HandleConsumeEntitlement(c *fiber.Ctx, req wire.ConsumeEntitlementRequestWire) error {
	session := c.Locals("session").(*session.Session)
	entitlementID, err := handlers.ParamID(c, "entitlementID")
	if err != nil {
		return err
	}

	entitlement, err := h.entitlementStore.GetEntitlement(c.Context(), entitlementID, session.UserID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return helpers.NotFound("entitlement_not_found", "Entitlement not found")
		}
		return err
	}

	if entitlement.ConsumedGuildID.Valid {
		return helpers.BadRequest("entitlement_already_consumed", "Entitlement already consumed")
	}

	_, err = h.entitlementStore.UpdateEntitlementConsumedGuildID(c.Context(), entitlementID, common.NullID{
		ID:    req.GuildID,
		Valid: true,
	})
	if err != nil {
		return fmt.Errorf("failed to update entitlement: %w", err)
	}

	if !entitlement.Consumed {
		err = h.rest.ConsumeEntitlement(h.appContext.ApplicationID(), entitlementID, rest.WithCtx(c.Context()))
		if err != nil {
			return fmt.Errorf("failed to consume entitlement: %w", err)
		}
	}

	return c.JSON(wire.ConsumeEntitlementResponseWire{
		Success: true,
	})
}

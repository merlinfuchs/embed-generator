package premium

import (
	"errors"
	"fmt"

	"log/slog"

	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
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
		features, err = h.planStore.GetPlanFeaturesForGuild(c.UserContext(), guildID.ID)
	} else {
		features, err = h.planStore.GetPlanFeaturesForUser(c.UserContext(), session.UserID)
	}

	if err != nil {
		slog.Error("Failed to get premium plan features", slog.Any("error", err))
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
		entitlements, err = h.entitlementStore.GetActiveEntitlementsForGuild(c.UserContext(), guildID.ID)
	} else {
		entitlements, err = h.entitlementStore.GetActiveEntitlementsForUser(c.UserContext(), session.UserID)
	}

	if err != nil {
		slog.Error("Failed to get premium entitlements", slog.Any("error", err))
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

	entitlement, err := h.entitlementStore.GetEntitlement(c.UserContext(), entitlementID, session.UserID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("entitlement_not_found", "Entitlement not found")
		}
		return err
	}

	if entitlement.ConsumedGuildID.Valid {
		return handlers.BadRequest("entitlement_already_consumed", "Entitlement already consumed")
	}

	_, err = h.entitlementStore.UpdateEntitlementConsumedGuildID(c.UserContext(), entitlementID, common.NullID{
		ID:    req.GuildID,
		Valid: true,
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			// A concurrent request consumed it between the read above and this write.
			return handlers.BadRequest("entitlement_already_consumed", "Entitlement already consumed")
		}
		return fmt.Errorf("failed to update entitlement: %w", err)
	}

	if !entitlement.Consumed {
		err = h.rest.ConsumeEntitlement(h.appContext.ApplicationID(), entitlementID, rest.WithCtx(c.UserContext()))
		if err != nil {
			return fmt.Errorf("failed to consume entitlement: %w", err)
		}
	}

	return c.JSON(wire.ConsumeEntitlementResponseWire{
		Success: true,
	})
}

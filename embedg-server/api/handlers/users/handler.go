package users

import (
	"database/sql"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/premium"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"gopkg.in/guregu/null.v4"
)

type UsersHandler struct {
	pg             *postgres.PostgresStore
	premiumManager *premium.PremiumManager
}

func New(pg *postgres.PostgresStore, premiumManager *premium.PremiumManager) *UsersHandler {
	return &UsersHandler{
		pg: pg,
	}
}

func (h *UsersHandler) HandleGetUser(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	userID := c.Params("userID")

	if userID == "@me" {
		userID = session.UserID
	}

	user, err := h.pg.Q.GetUser(c.Context(), userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("unknown_user", "The user does not exist.")
		}
		log.Error().Err(err).Msg("Failed to get user")
		return err
	}

	return c.JSON(wire.UserWire{
		ID:            user.ID,
		Name:          user.Name,
		Discriminator: user.Discriminator,
		Avatar:        null.NewString(user.Avatar.String, user.Avatar.Valid),
	})
}

func (h *UsersHandler) HandleGetUserPlan(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)

	subscriptions, err := h.pg.Q.GetSubscriptionsForUser(c.Context(), session.UserID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get subscriptions for user")
		return err
	}

	active := false
	var planInfo premium.PlanInfo
	for _, subscription := range subscriptions {
		if subscription.Status == "active" || subscription.Status == "trialing" {
			for _, priceID := range subscription.PriceIds {
				plan := h.premiumManager.GetPlanByPriceID(priceID)
				if plan != nil {
					planInfo = plan.Info()
					active = true
					break
				}
			}
			break
		}
	}

	return c.JSON(wire.PlanInfoWire{
		Active:      active,
		ServerCount: planInfo.ServerCount,
	})
}

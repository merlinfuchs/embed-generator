package payments

import (
	"database/sql"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/premium"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"github.com/stripe/stripe-go/v74"
	portalsession "github.com/stripe/stripe-go/v74/billingportal/session"
	checkoutsession "github.com/stripe/stripe-go/v74/checkout/session"
)

type PaymentsHandler struct {
	pg             *postgres.PostgresStore
	premiumManager *premium.PremiumManager
	accessManager  *access.AccessManager
}

func New(pg *postgres.PostgresStore, premiumManager *premium.PremiumManager, accessManager *access.AccessManager) *PaymentsHandler {
	stripe.Key = viper.GetString("stripe.api_key")

	return &PaymentsHandler{
		pg:             pg,
		premiumManager: premiumManager,
		accessManager:  accessManager,
	}
}

func (h *PaymentsHandler) HandleCreateCheckoutSession(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)

	plan := h.premiumManager.GetPlanByID(c.Query("plan"))
	if plan == nil {
		return helpers.BadRequest("unknown_plan", "Plan does not exist")
	}

	guildID := c.Query("guild_id")
	if guildID == "" {
		return helpers.BadRequest("no_guild_id", "No guild id provided")
	}

	if err := h.accessManager.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	_, err := h.pg.Q.GetActiveSubscriptionForGuild(c.Context(), postgres.GetActiveSubscriptionForGuildParams{
		GuildID: guildID,
		Column2: plan.PriceID,
	})
	if err == nil {
		return helpers.BadRequest("already_subscribed", "Server is already subscribed to this plan")
	} else if err != sql.ErrNoRows {
		return err
	}

	var customerID *string
	if stripeCustomerID, err := h.pg.Q.GetStripeCustomerIdForGuild(c.Context(), guildID); err == nil {
		customerID = &stripeCustomerID
	} else if err != sql.ErrNoRows {
		return err
	}

	returnURL := viper.GetString("app.public_url") + "/premium"

	checkoutParams := &stripe.CheckoutSessionParams{
		AllowPromotionCodes: stripe.Bool(true),
		SubscriptionData: &stripe.CheckoutSessionSubscriptionDataParams{
			Metadata: map[string]string{
				"guild_id": guildID,
				"user_id":  session.UserID,
			},
		},
		Customer: customerID,
		Mode:     stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(plan.PriceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: &returnURL,
		CancelURL:  &returnURL,
	}

	s, err := checkoutsession.New(checkoutParams)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create checkout session")
		return err
	}

	return c.Redirect(s.URL, http.StatusSeeOther)
}

func (h *PaymentsHandler) HandleCreatePortalSession(c *fiber.Ctx) error {
	guildID := c.Query("guild_id")
	if guildID == "" {
		return helpers.BadRequest("no_guild_id", "No guild id provided")
	}

	if err := h.accessManager.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	stripeCustomerID, err := h.pg.Q.GetStripeCustomerIdForGuild(c.Context(), guildID)
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.BadRequest("no_stripe_customer", "Server has no stripe customer")
		}
		return err
	}

	params := &stripe.BillingPortalSessionParams{
		Customer:  &stripeCustomerID,
		ReturnURL: stripe.String(viper.GetString("app.public_url") + "/premium"),
	}
	ps, err := portalsession.New(params)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create portal session")
		return err
	}

	return c.Redirect(ps.URL, http.StatusSeeOther)
}

func (h *PaymentsHandler) HandleListSubscriptions(c *fiber.Ctx) error {
	guildID := c.Query("guild_id")
	if guildID == "" {
		return helpers.BadRequest("no_guild_id", "No guild id provided")
	}

	if err := h.accessManager.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	subscriptions, err := h.pg.Q.GetSubscriptionsForGuild(c.Context(), guildID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get subscriptions for guild")
		return err
	}

	res := make([]wire.GuildSubscriptionWire, 0)

	for _, subscription := range subscriptions {
		var plan *premium.Plan
		for _, priceID := range subscription.PriceIds {
			plan = h.premiumManager.GetPlanByPriceID(priceID)
			if plan != nil {
				break
			}
		}

		if plan != nil {
			res = append(res, wire.GuildSubscriptionWire{
				Plan:      plan.ID,
				Status:    subscription.Status,
				UpdatedAt: subscription.UpdatedAt,
			})
		}
	}

	return c.JSON(wire.ListGuildSubscriptionsResponseWire{
		Success: true,
		Data:    res,
	})
}

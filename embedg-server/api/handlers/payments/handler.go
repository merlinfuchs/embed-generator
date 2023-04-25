package payments

import (
	"database/sql"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/premium"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"github.com/stripe/stripe-go/v74"
	portalsession "github.com/stripe/stripe-go/v74/billingportal/session"
	checkoutsession "github.com/stripe/stripe-go/v74/checkout/session"
	"github.com/stripe/stripe-go/v74/customer"
)

type PaymentsHandler struct {
	pg             *postgres.PostgresStore
	premiumManager *premium.PremiumManager
}

func New(pg *postgres.PostgresStore, premiumManager *premium.PremiumManager) *PaymentsHandler {
	stripe.Key = viper.GetString("stripe.api_key")

	return &PaymentsHandler{
		pg:             pg,
		premiumManager: premiumManager,
	}
}

func (h *PaymentsHandler) HandleCreateCheckoutSession(c *fiber.Ctx) error {
	plan := h.premiumManager.GetPlanByID(c.Query("plan"))
	if plan == nil {
		return helpers.BadRequest("unknown_plan", "Plan does not exist")
	}

	session := c.Locals("session").(*session.Session)

	user, err := h.pg.Q.GetUser(c.Context(), session.UserID)
	if err != nil {
		return err
	}

	customerID := user.StripeCustomerID.String

	if customerID == "" {
		cus, err := customer.New(&stripe.CustomerParams{
			Name: &user.Name,
			Params: stripe.Params{
				Metadata: map[string]string{
					"user_id": user.ID,
				},
			},
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to create customer")
			return err
		}

		_, err = h.pg.Q.UpdateUserStripeCustomerId(c.Context(), postgres.UpdateUserStripeCustomerIdParams{
			ID:               user.ID,
			StripeCustomerID: sql.NullString{String: cus.ID, Valid: true},
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to set user stripe customer id")
			return err
		}

		customerID = cus.ID
	}

	checkoutParams := &stripe.CheckoutSessionParams{
		AllowPromotionCodes: stripe.Bool(true),
		ClientReferenceID:   &session.UserID,
		Customer:            &customerID,
		Mode:                stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(plan.PriceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(viper.GetString("app.public_url")),
		CancelURL:  stripe.String(viper.GetString("app.public_url")),
	}

	s, err := checkoutsession.New(checkoutParams)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create checkout session")
		return err
	}

	return c.Redirect(s.URL, http.StatusSeeOther)
}

func (h *PaymentsHandler) HandleCreatePortalSession(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)

	user, err := h.pg.Q.GetUser(c.Context(), session.UserID)
	if err != nil {
		return err
	}

	if !user.StripeCustomerID.Valid {
		return helpers.BadRequest("no_stripe_customer", "User has no stripe customer")
	}

	params := &stripe.BillingPortalSessionParams{
		Customer:  &user.StripeCustomerID.String,
		ReturnURL: stripe.String(viper.GetString("app.public_url")),
	}
	ps, err := portalsession.New(params)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create portal session")
		return err
	}

	return c.Redirect(ps.URL, http.StatusSeeOther)
}

package payments

import (
	"database/sql"
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/webhook"
)

func (h *PaymentsHandler) HandleWebhook(c *fiber.Ctx) error {
	endpointSecret := viper.GetString("stripe.webhook_secret")
	signatureHeader := c.Get("Stripe-Signature")
	event, err := webhook.ConstructEvent(c.Body(), signatureHeader, endpointSecret)
	if err != nil {
		log.Error().Err(err).Msg("Failed to construct webhook event")
		return c.SendStatus(400)
	}

	switch event.Type {
	case "customer.subscription.deleted", "customer.subscription.updated", "customer.subscription.created", "customer.subscription.trial_will_end":
		subscription, err := parseWebhookEvent[stripe.Subscription](event.Data.Raw)
		if err != nil {
			log.Error().Err(err).Msg("Failed to parse webhook event")
			return err
		}

		user, err := h.pg.Q.GetUserByStripeCustomerId(c.Context(), sql.NullString{String: subscription.Customer.ID, Valid: true})
		if err != nil {
			log.Error().Err(err).Msg("Failed to get user for subscription event")
			return err
		}

		pricesIDs := make([]string, len(subscription.Items.Data))
		for i, item := range subscription.Items.Data {
			pricesIDs[i] = item.Price.ID
		}

		_, err = h.pg.Q.UpsertUserSubscription(c.Context(), postgres.UpsertUserSubscriptionParams{
			ID:       subscription.ID,
			UserID:   user.ID,
			Status:   string(subscription.Status),
			PriceIds: pricesIDs,
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to upsert subscription")
			return err
		}
	case "customer.updated":
		customer, err := parseWebhookEvent[stripe.Customer](event.Data.Raw)
		if err != nil {
			log.Error().Err(err).Msg("Failed to parse webhook event")
			return err
		}

		if customer.Email != "" {
			_, err = h.pg.Q.UpdateUserStripeEmail(c.Context(), postgres.UpdateUserStripeEmailParams{
				ID:          customer.Metadata["user_id"],
				StripeEmail: sql.NullString{String: customer.Email, Valid: true},
			})
			if err != nil {
				log.Error().Err(err).Msg("Failed to update user")
				return err
			}
		}
	default:
		log.Debug().Str("event_type", event.Type).Msg("Unhandled event type")
	}

	return c.SendStatus(200)
}

func parseWebhookEvent[T any](d []byte) (*T, error) {
	// Parse the event
	event := new(T)
	err := json.Unmarshal(d, &event)
	if err != nil {
		log.Error().Err(err).Msg("Failed to parse webhook JSON")
		return nil, err
	}
	return event, nil
}

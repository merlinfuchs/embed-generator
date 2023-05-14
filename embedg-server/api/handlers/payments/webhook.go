package payments

import (
	"encoding/json"
	"time"

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

		guildID := subscription.Metadata["guild_id"]
		userID := subscription.Metadata["user_id"]
		if guildID == "" || userID == "" {
			log.Error().Msg("Missing metadata in subscription event")
			return c.SendStatus(400)
		}

		pricesIDs := make([]string, len(subscription.Items.Data))
		for i, item := range subscription.Items.Data {
			pricesIDs[i] = item.Price.ID
		}

		_, err = h.pg.Q.UpsertSubscription(c.Context(), postgres.UpsertSubscriptionParams{
			ID:               subscription.ID,
			UserID:           userID,
			GuildID:          guildID,
			Status:           string(subscription.Status),
			StripeCustomerID: subscription.Customer.ID,
			PriceIds:         pricesIDs,
			UpdatedAt:        time.Now().UTC(),
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to upsert subscription")
			return err
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

-- name: UpsertSubscription :one
INSERT INTO subscriptions (id, user_id, guild_id, stripe_customer_id, status, price_ids, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET status = $5, price_ids = $6, updated_at = $7 RETURNING *;

-- name: GetStripeCustomerIdForGuild :one
SELECT stripe_customer_id FROM subscriptions WHERE guild_id = $1;

-- name: GetSubscriptionsForGuild :many
SELECT * FROM subscriptions WHERE guild_id = $1;

-- name: GetSubscriptionsForUser :many
SELECT * FROM subscriptions WHERE user_id = $1;

-- name: GetActiveSubscriptionForGuild :one
SELECT * FROM subscriptions WHERE guild_id = $1 AND $2::TEXT = ANY(price_ids) AND (status = 'active' OR status = 'trialing');
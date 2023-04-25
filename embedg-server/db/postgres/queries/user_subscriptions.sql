-- name: UpsertUserSubscription :one
INSERT INTO user_subscriptions (id, user_id, status, price_ids, guild_ids) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET user_id = $2, status = $3, price_ids = $4 RETURNING *;

-- name: GetSubscriptionsForGuild :many
SELECT * FROM user_subscriptions WHERE $1::TEXT = ANY(guild_ids);

-- name: GetSubscriptionsForUser :many
SELECT * FROM user_subscriptions WHERE user_id = $1;

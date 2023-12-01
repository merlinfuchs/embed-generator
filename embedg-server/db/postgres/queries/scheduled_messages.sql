-- name: GetDueScheduledMessages :many
SELECT * FROM scheduled_messages WHERE trigger_at <= $1;

-- name: GetScheduledMessages :many
SELECT * FROM scheduled_messages WHERE guild_id = $1 ORDER BY updated_at DESC;

-- name: GetScheduledMessage :one
SELECT * FROM scheduled_messages WHERE id = $1 AND guild_id = $2;

-- name: DeleteScheduledMessage :exec
DELETE FROM scheduled_messages WHERE id = $1 AND guild_id = $2;

-- name: InsertScheduledMessage :one
INSERT INTO scheduled_messages (id, creator_id, guild_id, channel_id, message_id, saved_message_id, cron_expression, trigger_at, trigger_once, enabled, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;

-- name: UpdateScheduledMessage :one
UPDATE scheduled_messages SET channel_id = $3, message_id = $4, saved_message_id = $5, cron_expression = $6, trigger_at = $7, trigger_once = $8, enabled = $9, updated_at = $10 WHERE id = $1 AND guild_id = $2 RETURNING *;
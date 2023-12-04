-- name: GetDueScheduledMessages :many
SELECT * FROM scheduled_messages WHERE next_at <= $1 AND enabled = true;

-- name: GetScheduledMessages :many
SELECT * FROM scheduled_messages WHERE guild_id = $1 ORDER BY updated_at DESC;

-- name: GetScheduledMessage :one
SELECT * FROM scheduled_messages WHERE id = $1 AND guild_id = $2;

-- name: DeleteScheduledMessage :exec
DELETE FROM scheduled_messages WHERE id = $1 AND guild_id = $2;

-- name: InsertScheduledMessage :one
INSERT INTO scheduled_messages (id, creator_id, guild_id, channel_id, message_id, saved_message_id, name, description, cron_expression, start_at, end_at, next_at, only_once, enabled, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *;

-- name: UpdateScheduledMessage :one
UPDATE scheduled_messages SET channel_id = $3, message_id = $4, saved_message_id = $5, name = $6, description = $7, cron_expression = $8, next_at = $9, start_at = $10, end_at = $11, only_once = $12, enabled = $13, updated_at = $14 WHERE id = $1 AND guild_id = $2 RETURNING *;

-- name: UpdateScheduledMessageNextAt :one
UPDATE scheduled_messages SET next_at = $3, updated_at = $4 WHERE id = $1 AND guild_id = $2 RETURNING *;

-- name: UpdateScheduledMessageEnabled :one
UPDATE scheduled_messages SET enabled = $3, updated_at = $4 WHERE id = $1 AND guild_id = $2 RETURNING *;
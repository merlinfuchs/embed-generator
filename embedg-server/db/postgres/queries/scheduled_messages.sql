-- name: GetDueScheduledMessages :many
SELECT * FROM scheduled_messages WHERE next_at <= $1 AND (end_at IS NULL OR end_at >= $1) AND enabled = true;

-- name: GetScheduledMessages :many
SELECT * FROM scheduled_messages WHERE guild_id = $1 ORDER BY updated_at DESC;

-- name: GetScheduledMessage :one
SELECT * FROM scheduled_messages WHERE id = $1 AND guild_id = $2;

-- name: DeleteScheduledMessage :exec
DELETE FROM scheduled_messages WHERE id = $1 AND guild_id = $2;

-- name: InsertScheduledMessage :one
INSERT INTO scheduled_messages (
    id, 
    creator_id, 
    guild_id, 
    channel_id, 
    message_id, 
    thread_name, 
    saved_message_id, 
    name, 
    description, 
    cron_expression, 
    cron_timezone, 
    start_at, 
    end_at, 
    next_at, 
    only_once, 
    enabled, 
    created_at, 
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
) RETURNING *;

-- name: UpdateScheduledMessage :one
UPDATE scheduled_messages SET 
    channel_id = $3, 
    message_id = $4, 
    thread_name = $5, 
    saved_message_id = $6, 
    name = $7, 
    description = $8, 
    cron_expression = $9, 
    next_at = $10, 
    start_at = $11, 
    end_at = $12, 
    only_once = $13, 
    enabled = $14, 
    updated_at = $15, 
    cron_timezone = $16 
WHERE id = $1 AND guild_id = $2 RETURNING *;

-- name: UpdateScheduledMessageNextAt :one
UPDATE scheduled_messages SET next_at = $3, updated_at = $4 WHERE id = $1 AND guild_id = $2 RETURNING *;

-- name: UpdateScheduledMessageEnabled :one
UPDATE scheduled_messages SET enabled = $3, updated_at = $4 WHERE id = $1 AND guild_id = $2 RETURNING *;
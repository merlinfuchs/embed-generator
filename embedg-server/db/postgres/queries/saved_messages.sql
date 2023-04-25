-- name: InsertSavedMessage :one
INSERT INTO saved_messages (id, creator_id, guild_id, updated_at, name, description, data) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: UpdateSavedMessageForCreator :one
UPDATE saved_messages SET updated_at = $3, name = $4, description = $5, data = $6 WHERE id = $1 AND creator_id = $2 RETURNING *;

-- name: UpdateSavedMessageForGuild :one
UPDATE saved_messages SET updated_at = $3, name = $4, description = $5, data = $6 WHERE id = $1 AND guild_id = $2 RETURNING *;

-- name: DeleteSavedMessageForCreator :exec
DELETE FROM saved_messages WHERE id = $1 AND creator_id = $2;

-- name: DeleteSavedMessageForGuild :exec
DELETE FROM saved_messages WHERE id = $1 AND guild_id = $2;

-- name: GetSavedMessagesForCreator :many
SELECT * FROM saved_messages WHERE creator_id = $1 AND guild_id IS NULL ORDER BY updated_at DESC;

-- name: GetSavedMessagesForGuild :many
SELECT * FROM saved_messages WHERE guild_id = $1 ORDER BY updated_at DESC;
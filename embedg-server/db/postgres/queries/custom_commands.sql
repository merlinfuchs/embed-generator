-- name: GetCustomCommands :many
SELECT * FROM custom_commands WHERE guild_id = $1;

-- name: GetCustomCommand :one
SELECT * FROM custom_commands WHERE id = $1 AND guild_id = $2;

-- name: CountCustomCommands :one
SELECT COUNT(*) FROM custom_commands WHERE guild_id = $1;

-- name: InsertCustomCommand :one
INSERT INTO custom_commands (id, guild_id, name, description, actions, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: UpdateCustomCommand :one
UPDATE custom_commands SET name = $3, description = $4, actions = $5, updated_at = $6 WHERE id = $1 AND guild_id = $2 RETURNING *;

-- name: DeleteCustomCommand :one
DELETE FROM custom_commands WHERE id = $1 AND guild_id = $2 RETURNING *;
-- name: GetCustomCommands :many
SELECT * FROM custom_commands WHERE guild_id = $1;

-- name: GetCustomCommand :one
SELECT * FROM custom_commands WHERE id = $1 AND guild_id = $2;

-- name: GetCustomCommandByName :one
SELECT * FROM custom_commands WHERE name = $1 AND guild_id = $2;

-- name: CountCustomCommands :one
SELECT COUNT(*) FROM custom_commands WHERE guild_id = $1;

-- name: InsertCustomCommand :one
INSERT INTO custom_commands (id, guild_id, name, description, parameters, actions, derived_permissions, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;

-- name: UpdateCustomCommand :one
UPDATE custom_commands SET name = $3, description = $4, enabled = $5, actions = $6, parameters = $7, derived_permissions = $8, updated_at = $9 WHERE id = $1 AND guild_id = $2 RETURNING *;

-- name: DeleteCustomCommand :one
DELETE FROM custom_commands WHERE id = $1 AND guild_id = $2 RETURNING *;

-- name: SetCustomCommandsDeployedAt :one
UPDATE custom_commands SET deployed_at = $2 WHERE guild_id = $1 RETURNING *;

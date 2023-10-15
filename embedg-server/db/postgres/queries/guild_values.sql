-- name: GetGuildValues :many
SELECT * FROM guild_values WHERE guild_id = $1;

-- name: GetGuildValue :one
SELECT * FROM guild_values WHERE guild_id = $1 AND key = $2;

-- name: SetGuildValue :one
INSERT INTO guild_values (guild_id, key, value, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (guild_id, key) DO UPDATE SET value = $3, created_at = $4 RETURNING *;

-- name: DeleteGuildValue :one
DELETE FROM guild_values WHERE guild_id = $1 AND key = $2 RETURNING *;
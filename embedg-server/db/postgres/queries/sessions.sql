-- name: InsertSession :one
INSERT INTO sessions (token_hash, user_id, guild_ids, access_token, refresh_token, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: GetSession :one
SELECT * FROM sessions WHERE token_hash = $1;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE token_hash = $1;

-- name: GetSessionsForUser :many
SELECT * FROM sessions WHERE user_id = $1;
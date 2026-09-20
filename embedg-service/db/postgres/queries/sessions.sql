-- name: InsertSession :one
INSERT INTO sessions (
    token_hash,
    user_id,
    guild_ids,
    access_token,
    refresh_token,
    token_expires_at,
    scopes,
    created_at,
    expires_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;

-- name: GetSession :one
SELECT * FROM sessions WHERE token_hash = $1;

-- name: UpdateSessionTokens :exec
UPDATE sessions SET access_token = $2, refresh_token = $3, token_expires_at = $4 WHERE token_hash = $1;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE token_hash = $1;

-- name: GetSessionsForUser :many
SELECT * FROM sessions WHERE user_id = $1;

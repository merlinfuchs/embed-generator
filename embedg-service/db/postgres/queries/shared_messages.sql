-- name: InsertSharedMessage :one
INSERT INTO shared_messages (id, created_at, expires_at, data) VALUES ($1, $2, $3, $4) RETURNING *;

-- name: GetSharedMessage :one
SELECT * FROM shared_messages WHERE id = $1;

-- name: DeleteExpiredSharedMessages :exec
DELETE FROM shared_messages WHERE expires_at < $1;

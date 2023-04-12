-- name: InsertSavedMessage :one
INSERT INTO saved_messages (id, owner_id, updated_at, name, description, data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;

-- name: UpdateSavedMessage :one
UPDATE saved_messages SET updated_at = $3, name = $4, description = $5, data = $6 WHERE id = $1 AND owner_id = $2 RETURNING *;

-- name: DeleteSavedMessage :exec
DELETE FROM saved_messages WHERE id = $1 AND owner_id = $2;

-- name: GetSavedMessage :one
SELECT * FROM saved_messages WHERE id = $1 AND owner_id = $2;

-- name: GetSavedMessages :many
SELECT * FROM saved_messages WHERE owner_id = $1;
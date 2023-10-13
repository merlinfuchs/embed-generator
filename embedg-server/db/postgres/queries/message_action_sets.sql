-- name: InsertMessageActionSet :one
INSERT INTO message_action_sets (id, message_id, set_id, actions, permission_context, ephemeral) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;

-- name: GetMessageActionSet :one
SELECT * FROM message_action_sets WHERE message_id = $1 AND set_id = $2;

-- name: DeleteMessageActionSetsForMessage :exec
DELETE FROM message_action_sets WHERE message_id = $1;

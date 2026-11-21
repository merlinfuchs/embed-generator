-- name: GetForms :many
SELECT * FROM forms WHERE guild_id = $1 ORDER BY created_at ASC;

-- name: GetForm :one
SELECT * FROM forms WHERE id = $1 AND guild_id = $2;

-- name: CountForms :one
SELECT COUNT(*) FROM forms WHERE guild_id = $1;

-- name: InsertForm :one
INSERT INTO forms (id, guild_id, name, title, fields, actions, derived_permissions, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;

-- name: UpdateForm :one
UPDATE forms SET name = $3, title = $4, fields = $5, actions = $6, derived_permissions = $7, updated_at = $8 WHERE id = $1 AND guild_id = $2 RETURNING *;

-- name: DeleteForm :one
DELETE FROM forms WHERE id = $1 AND guild_id = $2 RETURNING *;

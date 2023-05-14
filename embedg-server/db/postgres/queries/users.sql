-- name: UpsertUser :one
INSERT INTO users (id, name, discriminator, avatar) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = $2, discriminator = $3, avatar = $4 RETURNING *;

-- name: GetUser :one
SELECT * FROM users WHERE id = $1;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;
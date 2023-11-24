-- name: InsertImage :one
INSERT INTO images (id, guild_id, user_id, file_hash, file_name, file_content_type, file_size, s3_key) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;

-- name: GetImage :one
SELECT * FROM images WHERE id = $1;
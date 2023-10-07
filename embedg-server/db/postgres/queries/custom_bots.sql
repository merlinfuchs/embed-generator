-- name: UpsertCustomBot :one
INSERT INTO custom_bots (id, guild_id, application_id, user_id, user_name, user_avatar, token, public_key, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
ON CONFLICT (guild_id) DO UPDATE SET id = $1, application_id = $3, user_id = $4, user_name = $5, user_avatar = $6, token = $7, public_key = $8, created_at = $9 
RETURNING *;

-- name: DeleteCustomBot :one
DELETE FROM custom_bots WHERE guild_id = $1 RETURNING *;

-- name: GetCustomBot :one
SELECT * FROM custom_bots WHERE id = $1;

-- name: GetCustomBotByGuildID :one
SELECT * FROM custom_bots WHERE guild_id = $1;

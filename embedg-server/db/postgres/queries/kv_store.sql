-- name: GetKVKey :one
SELECT * FROM kv_store WHERE key = $1 AND guild_id = $2;

-- name: SetKVKey :exec
INSERT INTO kv_store (
    key, 
    guild_id, 
    value, 
    expires_at, 
    created_at, 
    updated_at
) VALUES (
    $1, 
    $2, 
    $3, 
    $4, 
    $5, 
    $6
) ON CONFLICT (key, guild_id) 
DO UPDATE SET 
    value = EXCLUDED.value, 
    expires_at = EXCLUDED.expires_at, 
    updated_at = EXCLUDED.updated_at;

-- name: IncreaseKVKey :one
INSERT INTO kv_store (
    key, 
    guild_id, 
    value, 
    expires_at, 
    created_at, 
    updated_at
) VALUES (
    $1, 
    $2, 
    $3, 
    $4, 
    $5, 
    $6
) ON CONFLICT (key, guild_id)
DO UPDATE SET 
    value = kv_store.value::int + EXCLUDED.value::int, 
    expires_at = EXCLUDED.expires_at, 
    updated_at = EXCLUDED.updated_at
RETURNING *;

-- name: DeleteKVKey :one
DELETE FROM kv_store WHERE key = $1 AND guild_id = $2 RETURNING *;

-- name: SearchKVKeys :many
SELECT * FROM kv_store WHERE key LIKE $1 AND guild_id = $2;

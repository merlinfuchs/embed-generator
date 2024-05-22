-- name: GetKVEntry :one
SELECT * FROM kv_entries WHERE key = $1 AND guild_id = $2;

-- name: SetKVEntry :exec
INSERT INTO kv_entries (
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

-- name: IncreaseKVEntry :one
INSERT INTO kv_entries (
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
    value = kv_entries.value::int + EXCLUDED.value::int, 
    expires_at = EXCLUDED.expires_at, 
    updated_at = EXCLUDED.updated_at
RETURNING *;

-- name: DeleteKVEntry :one
DELETE FROM kv_entries WHERE key = $1 AND guild_id = $2 RETURNING *;

-- name: SearchKVEntries :many
SELECT * FROM kv_entries WHERE key LIKE $1 AND guild_id = $2;

-- name: CountKVEntries :one
SELECT COUNT(*) FROM kv_entries WHERE guild_id = $1;
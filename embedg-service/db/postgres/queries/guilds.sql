-- name: UpsertGuild :exec
INSERT INTO guilds (
    id,
    name,
    icon,
    owner_id,
    joined_at,
    left_at,
    updated_at
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    NULL,
    $5
) ON CONFLICT (id)
DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    owner_id = EXCLUDED.owner_id,
    left_at = NULL,
    updated_at = EXCLUDED.updated_at;

-- name: MarkGuildLeft :exec
UPDATE guilds SET left_at = $2, updated_at = $2 WHERE id = $1;

-- name: GetGuilds :many
SELECT * FROM guilds WHERE id = ANY($1::bigint[]) AND left_at IS NULL;

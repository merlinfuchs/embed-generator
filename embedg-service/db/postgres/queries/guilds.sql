-- name: MarkGuildLeft :exec
UPDATE guilds SET left_at = $2, updated_at = $2 WHERE id = $1;

-- name: GetGuilds :many
SELECT * FROM guilds WHERE id = ANY($1::bigint[]) AND left_at IS NULL;

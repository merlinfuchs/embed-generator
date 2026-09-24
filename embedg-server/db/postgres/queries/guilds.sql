-- name: MarkGuildLeft :exec
UPDATE guilds SET left_at = $2, updated_at = $2 WHERE id = $1;

-- name: GetGuilds :many
SELECT * FROM guilds WHERE id = ANY($1::bigint[]) AND left_at IS NULL;

-- name: MarkGuildsLeftOnShard :exec
-- Marks every guild on the shard that isn't in keep_ids as left. Rows written since the ready
-- time are guilds joined while this ran, so they are skipped.
UPDATE guilds SET left_at = sqlc.arg(now), updated_at = sqlc.arg(now)
WHERE left_at IS NULL
  AND (id >> 22) % sqlc.arg(shard_count)::bigint = sqlc.arg(shard_id)::bigint
  AND updated_at < sqlc.arg(now)
  AND NOT (id = ANY(sqlc.arg(keep_ids)::bigint[]));

-- name: GetActiveEntitlementsForGuild :many
SELECT * FROM entitlements 
WHERE deleted = false 
  AND (starts_at IS NULL OR starts_at < NOW()) 
  AND (ends_at IS NULL OR ends_at > NOW()) 
  AND (guild_id = $1 OR consumed_guild_id = $1);

-- name: GetActiveEntitlementsForUser :many
SELECT * FROM entitlements 
WHERE deleted = false 
  AND (starts_at IS NULL OR starts_at < NOW()) 
  AND (ends_at IS NULL OR ends_at > NOW()) 
  AND user_id = $1;

-- name: GetEntitlements :many
SELECT * FROM entitlements;

-- name: GetEntitlement :one
SELECT * FROM entitlements WHERE id = $1 AND user_id = $2;

-- name: UpdateEntitlementConsumedGuildID :one
UPDATE entitlements SET consumed = true, consumed_guild_id = $2 WHERE id = $1 RETURNING *;

-- name: UpsertEntitlement :one
INSERT INTO entitlements (
  id,
  user_id,
  guild_id,
  updated_at,
  deleted,
  sku_id,
  starts_at,
  ends_at,
  consumed
) VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9
) 
ON CONFLICT (id) 
DO UPDATE SET 
  deleted = $5, 
  starts_at = $7, 
  ends_at = $8, 
  updated_at = $4, 
  consumed = $9
RETURNING *;

-- name: GetEntitledUserIDs :many
SELECT DISTINCT user_id FROM entitlements;

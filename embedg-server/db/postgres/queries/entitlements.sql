-- name: GetActiveEntitlementForGuild :many
SELECT * FROM entitlements WHERE deleted = false AND (starts_at IS NULL OR starts_at < NOW()) AND (ends_at IS NULL OR ends_at > NOW()) AND guild_id = $1;

-- name: GetActiveEntitlementForUser :many
SELECT * FROM entitlements WHERE deleted = false AND (starts_at IS NULL OR starts_at < NOW()) AND (ends_at IS NULL OR ends_at > NOW()) AND user_id = $1;


/*
id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  guild_id TEXT,
  updated_at TIMESTAMP NOT NULL,
  deleted BOOLEAN NOT NULL,
  sku_id TEXT NOT NULL,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  */

-- name: UpsertEntitlement :one
INSERT INTO entitlements (id, user_id, guild_id, updated_at, deleted, sku_id, starts_at, ends_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
ON CONFLICT (id) 
DO UPDATE SET deleted = $5, starts_at = $7, ends_at = $8, updated_at = $4
RETURNING *;
CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guild_id TEXT,
  updated_at TIMESTAMP NOT NULL,
  deleted BOOLEAN NOT NULL,
  sku_id TEXT NOT NULL,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP
);
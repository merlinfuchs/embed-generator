CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  guild_id TEXT,
  updated_at TIMESTAMP NOT NULL,
  deleted BOOLEAN NOT NULL,
  sku_id TEXT NOT NULL,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL
);
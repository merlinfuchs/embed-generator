CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  price_ids TEXT[] NOT NULL,
  guild_ids TEXT[] NOT NULL
);
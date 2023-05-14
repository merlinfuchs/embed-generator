CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  guild_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL,
  price_ids TEXT[] NOT NULL
);
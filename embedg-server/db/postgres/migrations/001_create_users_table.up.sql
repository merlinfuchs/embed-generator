CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    discriminator TEXT NOT NULL,
    avatar TEXT,
    stripe_customer_id TEXT,
    stripe_email TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    discriminator TEXT NOT NULL,
    avatar TEXT,
    is_tester BOOLEAN NOT NULL DEFAULT FALSE
);

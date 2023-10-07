CREATE TABLE IF NOT EXISTS custom_bots (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    application_id TEXT NOT NULL,
    token TEXT NOT NULL,
    public_key TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    created_at TIMESTAMP NOT NULL
);

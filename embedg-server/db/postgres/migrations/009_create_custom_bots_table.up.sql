CREATE TABLE IF NOT EXISTS custom_bots (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    token TEXT NOT NULL,
    public_key TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
);

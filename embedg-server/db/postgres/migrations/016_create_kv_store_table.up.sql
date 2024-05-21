CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    value TEXT NOT NULL,

    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    PRIMARY KEY (key, guild_id)
);

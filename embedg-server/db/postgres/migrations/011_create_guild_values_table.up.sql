CREATE TABLE IF NOT EXISTS guild_values (
    guild_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value BYTEA NOT NULL,
    created_at TIMESTAMP NOT NULL,

    PRIMARY KEY(guild_id, key)
);

CREATE TABLE IF NOT EXISTS saved_messages (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    guild_id TEXT,
    updated_at TIMESTAMP NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    data JSONB NOT NULL
);

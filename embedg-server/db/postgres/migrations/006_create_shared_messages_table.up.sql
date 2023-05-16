CREATE TABLE IF NOT EXISTS shared_messages (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    data JSONB NOT NULL
);

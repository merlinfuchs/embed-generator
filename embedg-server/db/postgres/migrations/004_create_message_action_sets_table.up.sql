CREATE TABLE IF NOT EXISTS message_action_sets (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    set_id TEXT NOT NULL,
    actions JSONB NOT NULL
);

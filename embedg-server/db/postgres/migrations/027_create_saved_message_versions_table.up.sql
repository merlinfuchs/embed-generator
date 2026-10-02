-- What saved messages looked like before they were overwritten, so an overwrite can be undone.
CREATE TABLE IF NOT EXISTS saved_message_versions (
    id TEXT PRIMARY KEY,
    saved_message_id TEXT NOT NULL REFERENCES saved_messages (id) ON DELETE CASCADE,
    -- When this version was saved, not when it was overwritten.
    created_at TIMESTAMP NOT NULL,
    name TEXT NOT NULL,
    data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS saved_message_versions_saved_message_id_created_at ON saved_message_versions (saved_message_id, created_at DESC, id DESC);

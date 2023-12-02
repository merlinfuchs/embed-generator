CREATE TABLE IF NOT EXISTS scheduled_messages (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT,
    saved_message_id TEXT NOT NULL,
    cron_expression TEXT, -- This may be null if the message is scheduled to only be sent once
    only_once BOOLEAN NOT NULL DEFAULT false, -- Whether the message should be sent only once or repeatedly
    start_at TIMESTAMP NOT NULL, -- The first time the message was / will be sent
    end_at TIMESTAMP, -- The last time the message was / will be sent
    next_at TIMESTAMP NOT NULL, -- The next or only time the message should be sent
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

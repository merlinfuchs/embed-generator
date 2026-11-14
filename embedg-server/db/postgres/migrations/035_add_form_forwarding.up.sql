ALTER TABLE forms ADD COLUMN IF NOT EXISTS signing_secret TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS forward_error TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS forward_error_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS form_forward_counts (
    guild_id TEXT PRIMARY KEY,
    window_start TIMESTAMP NOT NULL,
    count INTEGER NOT NULL
);

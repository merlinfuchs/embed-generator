CREATE TABLE IF NOT EXISTS guilds (
    id BIGINT PRIMARY KEY,

    name TEXT NOT NULL,
    icon TEXT,
    owner_id BIGINT NOT NULL,

    joined_at TIMESTAMP NOT NULL,
    left_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS guilds_left_at_idx ON guilds (left_at) WHERE left_at IS NULL;

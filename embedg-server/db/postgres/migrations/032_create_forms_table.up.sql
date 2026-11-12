CREATE TABLE IF NOT EXISTS forms (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    fields JSONB NOT NULL,
    actions JSONB NOT NULL,
    derived_permissions JSONB,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS forms_guild_id_idx ON forms (guild_id);

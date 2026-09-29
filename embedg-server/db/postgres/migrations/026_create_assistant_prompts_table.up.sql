-- Prompts sent to the AI assistant. They count towards the guild's monthly limit, and keep the
-- tokens used to tune the limits.
CREATE TABLE IF NOT EXISTS assistant_prompts (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,

    model TEXT NOT NULL,
    prompt TEXT NOT NULL,
    -- Whether the assistant changed the message. Only prompts that did count towards the limit.
    edited BOOLEAN NOT NULL,
    -- Model calls made for the prompt, including repairs of its message.
    rounds INTEGER NOT NULL,
    input_tokens INTEGER NOT NULL,
    cached_input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,

    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS assistant_prompts_guild_id_created_at ON assistant_prompts (guild_id, created_at);

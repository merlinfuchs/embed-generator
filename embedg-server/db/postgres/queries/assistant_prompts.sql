-- name: InsertAssistantPrompt :exec
INSERT INTO assistant_prompts (
    id,
    guild_id,
    user_id,
    model,
    prompt,
    edited,
    rounds,
    input_tokens,
    cached_input_tokens,
    output_tokens,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
);

-- name: GetAssistantPrompt :one
SELECT * FROM assistant_prompts WHERE id = @id AND guild_id = @guild_id;

-- name: DeleteAssistantPrompt :exec
DELETE FROM assistant_prompts WHERE id = @id AND guild_id = @guild_id;

-- name: StartAssistantPromptRound :execrows
UPDATE assistant_prompts SET
    rounds = rounds + 1,
    updated_at = @updated_at
WHERE id = @id AND guild_id = @guild_id AND rounds < @max_rounds;

-- name: AddAssistantPromptUsage :exec
-- A prompt can only become unedited, when its first answer doesn't change the message.
UPDATE assistant_prompts SET
    edited = edited AND @edited,
    input_tokens = input_tokens + @input_tokens,
    cached_input_tokens = cached_input_tokens + @cached_input_tokens,
    output_tokens = output_tokens + @output_tokens,
    updated_at = @updated_at
WHERE id = @id AND guild_id = @guild_id;

-- name: CountAssistantPromptsSince :one
SELECT
    COUNT(*) FILTER (WHERE edited)::int AS edited,
    COUNT(*)::int AS total
FROM assistant_prompts WHERE guild_id = @guild_id AND created_at >= @start_at;

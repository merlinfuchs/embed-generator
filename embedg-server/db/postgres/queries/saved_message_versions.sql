-- name: InsertSavedMessageVersionForCreator :exec
INSERT INTO saved_message_versions (id, saved_message_id, created_at, name, data)
SELECT @id, saved_messages.id, saved_messages.updated_at, saved_messages.name, saved_messages.data FROM saved_messages
WHERE saved_messages.id = @saved_message_id AND saved_messages.creator_id = @creator_id AND saved_messages.data <> @new_data::jsonb;

-- name: InsertSavedMessageVersionForGuild :exec
INSERT INTO saved_message_versions (id, saved_message_id, created_at, name, data)
SELECT @id, saved_messages.id, saved_messages.updated_at, saved_messages.name, saved_messages.data FROM saved_messages
WHERE saved_messages.id = @saved_message_id AND saved_messages.guild_id = @guild_id AND saved_messages.data <> @new_data::jsonb;

-- name: DeleteOldSavedMessageVersions :exec
DELETE FROM saved_message_versions WHERE saved_message_versions.saved_message_id = @saved_message_id AND saved_message_versions.id NOT IN (
    SELECT newest.id FROM saved_message_versions newest WHERE newest.saved_message_id = @saved_message_id ORDER BY newest.created_at DESC, newest.id DESC LIMIT @keep_count
);

-- name: GetSavedMessageVersionsForCreator :many
SELECT saved_message_versions.id, saved_message_versions.created_at, saved_message_versions.name FROM saved_message_versions
JOIN saved_messages ON saved_messages.id = saved_message_versions.saved_message_id
WHERE saved_message_versions.saved_message_id = @saved_message_id AND saved_messages.creator_id = @creator_id AND saved_messages.guild_id IS NULL
ORDER BY saved_message_versions.created_at DESC, saved_message_versions.id DESC LIMIT @max_count;

-- name: GetSavedMessageVersionsForGuild :many
SELECT saved_message_versions.id, saved_message_versions.created_at, saved_message_versions.name FROM saved_message_versions
JOIN saved_messages ON saved_messages.id = saved_message_versions.saved_message_id
WHERE saved_message_versions.saved_message_id = @saved_message_id AND saved_messages.guild_id = @guild_id
ORDER BY saved_message_versions.created_at DESC, saved_message_versions.id DESC LIMIT @max_count;

-- name: GetSavedMessageVersionForCreator :one
SELECT saved_message_versions.* FROM saved_message_versions
JOIN saved_messages ON saved_messages.id = saved_message_versions.saved_message_id
WHERE saved_message_versions.id = @id AND saved_message_versions.saved_message_id = @saved_message_id AND saved_messages.creator_id = @creator_id AND saved_messages.guild_id IS NULL
AND saved_message_versions.id IN (
    SELECT newest.id FROM saved_message_versions newest WHERE newest.saved_message_id = @saved_message_id ORDER BY newest.created_at DESC, newest.id DESC LIMIT @max_count
);

-- name: GetSavedMessageVersionForGuild :one
SELECT saved_message_versions.* FROM saved_message_versions
JOIN saved_messages ON saved_messages.id = saved_message_versions.saved_message_id
WHERE saved_message_versions.id = @id AND saved_message_versions.saved_message_id = @saved_message_id AND saved_messages.guild_id = @guild_id
AND saved_message_versions.id IN (
    SELECT newest.id FROM saved_message_versions newest WHERE newest.saved_message_id = @saved_message_id ORDER BY newest.created_at DESC, newest.id DESC LIMIT @max_count
);

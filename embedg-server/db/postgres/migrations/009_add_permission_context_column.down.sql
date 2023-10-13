ALTER TABLE message_action_sets DROP COLUMN permission_context, DROP COLUMN last_used_at, DROP COLUMN ephemeral;

ALTER TABLE custom_commands DROP COLUMN permission_context, DROP COLUMN last_used_at;

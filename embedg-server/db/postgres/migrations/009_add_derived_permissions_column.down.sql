ALTER TABLE message_action_sets DROP COLUMN derived_permissions, DROP COLUMN last_used_at, DROP COLUMN ephemeral;

ALTER TABLE custom_commands DROP COLUMN derived_permissions, DROP COLUMN last_used_at;

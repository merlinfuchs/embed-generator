ALTER TABLE message_action_sets ADD COLUMN derived_permissions JSONB, ADD COLUMN last_used_at TIMESTAMP NOT NULL DEFAULT NOW(), ADD COLUMN ephemeral BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE custom_commands ADD COLUMN derived_permissions JSONB, ADD COLUMN last_used_at TIMESTAMP NOT NULL DEFAULT NOW();

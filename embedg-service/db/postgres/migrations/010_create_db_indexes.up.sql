CREATE INDEX ON saved_messages (guild_id);
CREATE INDEX ON saved_messages (creator_id);

CREATE INDEX ON custom_commands (guild_id);

CREATE INDEX ON message_action_sets (message_id);
CREATE INDEX ON message_action_sets (set_id);

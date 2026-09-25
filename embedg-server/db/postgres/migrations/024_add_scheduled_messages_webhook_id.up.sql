-- The webhook that sent message_id, null when the custom bot sent it itself. Known when the schedule
-- is saved, so running it doesn't have to fetch the message again.
ALTER TABLE scheduled_messages ADD COLUMN message_webhook_id TEXT;

-- Publishes each new message to the servers following the announcement channel. A failed publish
-- doesn't fail the send, so its reason is kept apart from last_error.
ALTER TABLE scheduled_messages ADD COLUMN crosspost BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE scheduled_messages ADD COLUMN last_crosspost_error TEXT;

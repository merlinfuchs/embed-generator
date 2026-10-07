-- The outcome of the last run, so users can see why a message didn't go out. last_error is cleared
-- by the next successful send and when the user saves the scheduled message.
ALTER TABLE scheduled_messages ADD COLUMN last_sent_at TIMESTAMP;
ALTER TABLE scheduled_messages ADD COLUMN last_error TEXT;
ALTER TABLE scheduled_messages ADD COLUMN last_error_at TIMESTAMP;

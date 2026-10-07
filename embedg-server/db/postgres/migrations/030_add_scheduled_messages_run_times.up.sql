-- A message sent on specific dates lists them here instead of having a cron expression. Sending
-- once is a list with one date, so the flag for it goes.
ALTER TABLE scheduled_messages ADD COLUMN run_times TIMESTAMP[];
UPDATE scheduled_messages SET run_times = ARRAY[start_at], cron_expression = NULL WHERE only_once;
ALTER TABLE scheduled_messages DROP COLUMN only_once;

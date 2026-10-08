-- A list of dates becomes a single send on its first date, the other dates are lost.
ALTER TABLE scheduled_messages ADD COLUMN only_once BOOLEAN NOT NULL DEFAULT false;
UPDATE scheduled_messages SET only_once = true, start_at = run_times[1] WHERE run_times IS NOT NULL;
ALTER TABLE scheduled_messages DROP COLUMN run_times;

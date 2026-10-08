-- Runs the cron expression only in every Nth day, week, month or hour, counted from its first run.
ALTER TABLE scheduled_messages ADD COLUMN cron_interval SMALLINT NOT NULL DEFAULT 1;

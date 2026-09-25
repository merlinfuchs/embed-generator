-- Schedules from before timezones were stored always ran in UTC.
UPDATE scheduled_messages SET cron_timezone = 'UTC' WHERE cron_timezone IS NULL OR cron_timezone = '';

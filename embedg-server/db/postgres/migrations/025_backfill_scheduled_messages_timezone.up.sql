-- Schedules from before timezones were stored always ran in UTC. One-time messages never used
-- their timezone, so an unknown one saved from the browser can go too.
UPDATE scheduled_messages SET cron_timezone = 'UTC'
WHERE cron_timezone IS NULL OR cron_timezone = ''
   OR (only_once AND cron_timezone NOT IN (SELECT name FROM pg_timezone_names));

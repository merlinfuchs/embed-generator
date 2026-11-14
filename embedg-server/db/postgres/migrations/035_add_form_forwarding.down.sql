DROP TABLE IF EXISTS form_forward_counts;

ALTER TABLE forms DROP COLUMN IF EXISTS forward_error_at;
ALTER TABLE forms DROP COLUMN IF EXISTS forward_error;
ALTER TABLE forms DROP COLUMN IF EXISTS signing_secret;

-- Existing sessions predate the guilds.members.read scope and have no refresh token,
-- so they can't be used for user token requests anyway. Drop them and re-login everyone.
DELETE FROM sessions;

ALTER TABLE sessions
    ADD COLUMN refresh_token TEXT NOT NULL,
    ADD COLUMN token_expires_at TIMESTAMP NOT NULL,
    ADD COLUMN scopes TEXT[] NOT NULL;

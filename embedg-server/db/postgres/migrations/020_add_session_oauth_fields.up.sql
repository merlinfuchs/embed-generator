-- Existing sessions predate the guilds.members.read scope and have no refresh token,
-- so they can't be used for user token requests anyway. Drop them and re-login everyone.
DELETE FROM sessions;

-- The defaults keep the previous release working against this schema, so a rollback needs no
-- down migration. Sessions it creates carry no scopes and this release rejects them with
-- scope_missing, which sends the user back to log in.
ALTER TABLE sessions
    ADD COLUMN refresh_token TEXT NOT NULL DEFAULT '',
    ADD COLUMN token_expires_at TIMESTAMP NOT NULL DEFAULT '1970-01-01',
    ADD COLUMN scopes TEXT[] NOT NULL DEFAULT '{}';

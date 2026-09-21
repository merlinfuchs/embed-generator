CREATE TABLE IF NOT EXISTS premium_role_assignments (
    user_id BIGINT PRIMARY KEY,
    assigned_at TIMESTAMP NOT NULL
);

-- Seed with everyone that ever held an entitlement so the first sweep strips the role from users
-- whose entitlement already lapsed. Rows for users that never had the role fall out on that sweep.
INSERT INTO premium_role_assignments (user_id, assigned_at)
SELECT DISTINCT user_id::BIGINT, NOW() FROM entitlements
WHERE user_id ~ '^[0-9]+$'
ON CONFLICT (user_id) DO NOTHING;

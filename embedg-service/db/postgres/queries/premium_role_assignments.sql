-- name: GetPremiumRoleAssignments :many
SELECT user_id FROM premium_role_assignments;

-- name: UpsertPremiumRoleAssignment :exec
INSERT INTO premium_role_assignments (user_id, assigned_at) VALUES ($1, $2)
ON CONFLICT (user_id) DO NOTHING;

-- name: DeletePremiumRoleAssignment :exec
DELETE FROM premium_role_assignments WHERE user_id = $1;

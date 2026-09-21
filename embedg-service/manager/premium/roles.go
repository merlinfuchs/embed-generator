package premium

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

// assignPremiumRoles reconciles the premium role in the beneficial guild against the entitlements
// in the database. Who currently holds the role is tracked in the premium role assignment table
// rather than fetched from Discord: listing members needs the privileged members intent, and a
// member request per entitled user ran into the guild member rate limit every sweep. In the steady
// state this makes no Discord requests at all.
func (m *PremiumManager) assignPremiumRoles(ctx context.Context) error {
	if m.config.BeneficialGuildID == 0 || m.config.BeneficialRoleID == 0 {
		return nil
	}

	entitled, err := m.entitledUserIDs(ctx)
	if err != nil {
		return err
	}

	assignedIDs, err := m.premiumRoleStore.GetPremiumRoleAssignments(ctx)
	if err != nil {
		return fmt.Errorf("failed to get premium role assignments: %w", err)
	}

	assigned := make(map[common.ID]struct{}, len(assignedIDs))
	for _, userID := range assignedIDs {
		assigned[userID] = struct{}{}
	}

	for userID := range entitled {
		if _, ok := assigned[userID]; ok {
			continue
		}

		err := m.rest.AddMemberRole(m.config.BeneficialGuildID, userID, m.config.BeneficialRoleID, rest.WithCtx(ctx))
		if err != nil {
			// Entitled users that never joined the beneficial guild are retried every sweep.
			if !common.IsDiscordRestErrorCode(err, rest.JSONErrorCodeUnknownMember) {
				slog.Error("Failed to add premium role", slog.Any("error", err))
			}
			continue
		}

		if err := m.premiumRoleStore.UpsertPremiumRoleAssignment(ctx, userID, time.Now().UTC()); err != nil {
			slog.Error("Failed to store premium role assignment", slog.Any("error", err))
		}
	}

	for userID := range assigned {
		if _, ok := entitled[userID]; ok {
			continue
		}

		err := m.rest.RemoveMemberRole(m.config.BeneficialGuildID, userID, m.config.BeneficialRoleID, rest.WithCtx(ctx))
		// A user that left the guild took the role with them, so the assignment is dropped either way.
		if err != nil && !common.IsDiscordRestErrorCode(err, rest.JSONErrorCodeUnknownMember) {
			slog.Error("Failed to remove premium role", slog.Any("error", err))
			continue
		}

		if err := m.premiumRoleStore.DeletePremiumRoleAssignment(ctx, userID); err != nil {
			slog.Error("Failed to delete premium role assignment", slog.Any("error", err))
		}
	}

	return nil
}

// entitledUserIDs resolves the users whose merged plan features make them premium. It mirrors
// GetPlanFeaturesForUser, but over one query for every active entitlement instead of one per user.
func (m *PremiumManager) entitledUserIDs(ctx context.Context) (map[common.ID]struct{}, error) {
	entitlements, err := m.entitlementStore.GetActiveEntitlements(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get active entitlements: %w", err)
	}

	features := make(map[common.ID]model.PlanFeatures)
	for _, entitlement := range entitlements {
		if !entitlement.UserID.Valid {
			continue
		}

		userFeatures, ok := features[entitlement.UserID.ID]
		if !ok {
			userFeatures = m.defaultPlanFeatures
		}
		if plan := m.GetPlanBySKUID(entitlement.SkuID); plan != nil {
			userFeatures.Merge(plan.Features)
		}
		features[entitlement.UserID.ID] = userFeatures
	}

	entitled := make(map[common.ID]struct{}, len(features))
	for userID, userFeatures := range features {
		if userFeatures.IsPremium {
			entitled[userID] = struct{}{}
		}
	}

	return entitled, nil
}

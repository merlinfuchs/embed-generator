package premium

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
)

// memberRequestInterval paces the member requests below the guild member rate limit. Without it the
// sweep runs into 429s on every user and disgo spends the whole sweep backing off and retrying.
// A var so tests don't have to wait for it.
var memberRequestInterval = time.Second

func (m *PremiumManager) assignPremiumRoles(ctx context.Context) error {
	if m.config.BeneficialGuildID == 0 || m.config.BeneficialRoleID == 0 {
		return nil
	}

	userIDs, err := m.entitlementStore.GetEntitledUserIDs(ctx)
	if err != nil {
		return fmt.Errorf("Failed to get entitled user IDs: %w", err)
	}

	pace := time.NewTicker(memberRequestInterval)
	defer pace.Stop()

	for _, userID := range userIDs {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-pace.C:
		}

		features, err := m.GetPlanFeaturesForUser(ctx, userID)
		if err != nil {
			slog.Error("Failed to get plan features for guild", slog.Any("error", err))
			continue
		}

		member, err := m.rest.GetMember(m.config.BeneficialGuildID, userID, rest.WithCtx(ctx))
		if err != nil {
			if common.IsDiscordRestErrorCode(err, rest.JSONErrorCodeUnknownMember) {
				continue
			}

			slog.Error("Failed to get guild member", slog.Any("error", err))
			continue
		}

		hasPremiumRole := false
		for _, r := range member.RoleIDs {
			if r == m.config.BeneficialRoleID {
				hasPremiumRole = true
				break
			}
		}

		if features.IsPremium && !hasPremiumRole {
			err = m.rest.AddMemberRole(m.config.BeneficialGuildID, userID, m.config.BeneficialRoleID, rest.WithCtx(ctx))
			if err != nil {
				slog.Error("Failed to add premium role", slog.Any("error", err))
			}
		} else if !features.IsPremium && hasPremiumRole {
			err = m.rest.RemoveMemberRole(m.config.BeneficialGuildID, userID, m.config.BeneficialRoleID, rest.WithCtx(ctx))
			if err != nil {
				slog.Error("Failed to remove premium role", slog.Any("error", err))
			}
		}
	}

	return nil
}

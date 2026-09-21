package premium

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
)

// defaultMemberRequestInterval paces the member requests. The sweep was seeing a 429 on every
// user, and it has a whole 15 minutes to get through the list, so spreading it out costs nothing.
const defaultMemberRequestInterval = time.Second

func (m *PremiumManager) assignPremiumRoles(ctx context.Context) error {
	if m.config.BeneficialGuildID == 0 || m.config.BeneficialRoleID == 0 {
		return nil
	}

	userIDs, err := m.entitlementStore.GetEntitledUserIDs(ctx)
	if err != nil {
		return fmt.Errorf("Failed to get entitled user IDs: %w", err)
	}

	pace := time.NewTicker(m.memberRequestInterval)
	defer pace.Stop()

	for _, userID := range userIDs {
		features, err := m.GetPlanFeaturesForUser(ctx, userID)
		if err != nil {
			slog.Error("Failed to get plan features for guild", slog.Any("error", err))
			continue
		}

		select {
		case <-ctx.Done():
			return nil
		case <-pace.C:
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

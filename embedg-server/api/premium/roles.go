package premium

import (
	"context"
	"fmt"
	"time"

	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

func (m *PremiumManager) lazyPremiumRolesTask() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	for {
		select {
		case <-ctx.Done():
			return
		case <-time.After(15 * time.Minute):
			if err := m.assignPremiumRoles(ctx); err != nil {
				log.Error().Err(err).Msg("Failed to assign premium roles")
			}
		}
	}
}

func (m *PremiumManager) assignPremiumRoles(ctx context.Context) error {
	rawGuildID := viper.GetString("premium.guild_id")
	rawRoleID := viper.GetString("premium.role_id")
	if rawGuildID == "" || rawRoleID == "" {
		return nil
	}

	guildID, err := util.ParseID(rawGuildID)
	if err != nil {
		return fmt.Errorf("Failed to parse guild ID: %w", err)
	}
	roleID, err := util.ParseID(rawRoleID)
	if err != nil {
		return fmt.Errorf("Failed to parse role ID: %w", err)
	}

	userIDs, err := m.GetEntitledUserIDs(ctx)
	if err != nil {
		return fmt.Errorf("Failed to get entitled user IDs: %w", err)
	}

	for _, userID := range userIDs {
		features, err := m.GetPlanFeaturesForUser(ctx, userID)
		if err != nil {
			log.Error().Err(err).Msg("Failed to get plan features for guild")
			continue
		}

		member, err := m.rest.GetMember(guildID, userID, rest.WithCtx(ctx))
		if err != nil {
			if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownMember) {
				continue
			}

			log.Error().Err(err).Msg("Failed to get guild member")
			continue
		}

		hasPremiumRole := false
		for _, r := range member.RoleIDs {
			if r == roleID {
				hasPremiumRole = true
				break
			}
		}

		if features.IsPremium && !hasPremiumRole {
			err = m.rest.AddMemberRole(guildID, userID, roleID, rest.WithCtx(ctx))
			if err != nil {
				log.Error().Err(err).Msg("Failed to add premium role")
			}
		} else if !features.IsPremium && hasPremiumRole {
			err = m.rest.RemoveMemberRole(guildID, userID, roleID, rest.WithCtx(ctx))
			if err != nil {
				log.Error().Err(err).Msg("Failed to remove premium role")
			}
		}
	}

	return nil
}

package premium

import (
	"context"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

func (m *PremiumManager) lazyPremiumRolesTask() {
	for {
		time.Sleep(15 * time.Minute)

		if err := m.assignPremiumRoles(); err != nil {
			log.Error().Err(err).Msg("Failed to assign premium roles")
		}
	}
}

func (m *PremiumManager) assignPremiumRoles() error {
	guildID := viper.GetString("premium.guild_id")
	roleID := viper.GetString("premium.role_id")
	if guildID == "" || roleID == "" {
		return nil
	}

	after := "0"
	for {
		members, err := m.bot.Session.GuildMembers(guildID, after, 1000)
		if err != nil {
			return fmt.Errorf("Failed to get guild members to assign premium roles: %w", err)
		}

		if len(members) == 0 {
			break
		}

		for _, member := range members {
			after = member.User.ID

			features, err := m.GetPlanFeaturesForUser(context.Background(), member.User.ID)
			if err != nil {
				log.Error().Err(err).Msg("Failed to get plan features for guild")
				continue
			}

			hasPremiumRole := false
			for _, r := range member.Roles {
				if r == roleID {
					hasPremiumRole = true
					break
				}
			}

			if features.IsPremium && !hasPremiumRole {
				err = m.bot.Session.GuildMemberRoleAdd(guildID, member.User.ID, roleID)
				if err != nil {
					log.Error().Err(err).Msg("Failed to add premium role")
				}
			} else if !features.IsPremium && hasPremiumRole {
				err = m.bot.Session.GuildMemberRoleRemove(guildID, member.User.ID, roleID)
				if err != nil {
					log.Error().Err(err).Msg("Failed to remove premium role")
				}
			}
		}
	}

	return nil
}

package premium

import (
	"context"
	"fmt"
	"time"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
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

	userIDs, err := m.GetEntitledUserIDs(context.Background())
	if err != nil {
		return fmt.Errorf("Failed to get entitled user IDs: %w", err)
	}

	for _, userID := range userIDs {
		features, err := m.GetPlanFeaturesForUser(context.Background(), userID)
		if err != nil {
			log.Error().Err(err).Msg("Failed to get plan features for guild")
			continue
		}

		member, err := m.bot.Session.GuildMember(guildID, userID)
		if err != nil {
			if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownMember) {
				continue
			}

			log.Error().Err(err).Msg("Failed to get guild member")
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
			err = m.bot.Session.GuildMemberRoleAdd(guildID, userID, roleID)
			if err != nil {
				log.Error().Err(err).Msg("Failed to add premium role")
			}
		} else if !features.IsPremium && hasPremiumRole {
			err = m.bot.Session.GuildMemberRoleRemove(guildID, userID, roleID)
			if err != nil {
				log.Error().Err(err).Msg("Failed to remove premium role")
			}
		}
	}

	return nil
}

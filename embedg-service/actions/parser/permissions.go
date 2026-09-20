package parser

import (
	"context"
	"fmt"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
)

// DerivePermissionsForActions records the authority the given member has at save time; the runtime
// replays it from the action set instead of re-checking. The caller resolves the member, with the
// user's own token from the dashboard or the bot token for a scheduled message's creator.
func (m *ActionParser) DerivePermissionsForActions(ctx context.Context, member discord.Member, guildID common.ID, channelID common.ID) (actions.ActionDerivedPermissions, error) {
	userID := member.User.ID

	res := actions.ActionDerivedPermissions{
		UserID: userID,
	}

	if channelID != 0 {
		channel, ok := m.caches.Channel(channelID)
		if !ok {
			return res, fmt.Errorf("channel not found in cache")
		}

		if channel.GuildID() != guildID {
			return res, fmt.Errorf("Channel %s does not belong to guild %s", channelID, guildID)
		}
	}

	guild, ok := m.caches.Guild(guildID)
	if !ok {
		return res, fmt.Errorf("guild not found in cache")
	}

	res.GuildIsOwner = guild.OwnerID == userID

	if channelID != 0 {
		channelPermissions, err := m.accessManager.ComputeMemberPermissionsForChannel(ctx, member, channelID)
		if err != nil {
			return res, err
		}
		res.ChannelPermissions = uint64(channelPermissions)
	}

	highestRolePosition := 0

	defaultRole, ok := m.caches.Role(guildID, guildID)
	if ok {
		highestRolePosition = defaultRole.Position
		res.GuildPermissions = uint64(defaultRole.Permissions)
	}

	for _, roleID := range member.RoleIDs {
		role, ok := m.caches.Role(guildID, roleID)
		if ok && role.Position > highestRolePosition {
			highestRolePosition = role.Position
			res.GuildPermissions |= uint64(role.Permissions)
		}
	}

	for role := range m.caches.Roles(guildID) {
		if role.Position < highestRolePosition {
			res.AllowedRoleIDs = append(res.AllowedRoleIDs, role.ID)
		}
	}

	return res, nil
}

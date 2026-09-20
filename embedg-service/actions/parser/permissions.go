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
		channel, err := m.guildState.Channel(ctx, channelID)
		if err != nil {
			return res, fmt.Errorf("failed to get channel: %w", err)
		}

		if channel.GuildID() != guildID {
			return res, fmt.Errorf("Channel %s does not belong to guild %s", channelID, guildID)
		}
	}

	state, err := m.guildState.Guild(ctx, guildID)
	if err != nil {
		return res, fmt.Errorf("failed to get guild: %w", err)
	}

	res.GuildIsOwner = state.Guild.OwnerID == userID

	if channelID != 0 {
		channelPermissions, err := m.accessManager.ComputeMemberPermissionsForChannel(ctx, member, channelID)
		if err != nil {
			return res, err
		}
		res.ChannelPermissions = uint64(channelPermissions)
	}

	highestRolePosition := 0

	// The @everyone role has the guild's id.
	defaultRole, ok := state.Role(guildID)
	if ok {
		highestRolePosition = defaultRole.Position
		res.GuildPermissions = uint64(defaultRole.Permissions)
	}

	for _, roleID := range member.RoleIDs {
		role, ok := state.Role(roleID)
		if ok && role.Position > highestRolePosition {
			highestRolePosition = role.Position
			res.GuildPermissions |= uint64(role.Permissions)
		}
	}

	for _, role := range state.Roles {
		if role.Position < highestRolePosition {
			res.AllowedRoleIDs = append(res.AllowedRoleIDs, role.ID)
		}
	}

	return res, nil
}

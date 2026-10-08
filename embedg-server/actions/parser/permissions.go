package parser

import (
	"context"
	"fmt"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
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
			return res, common.NewUserError(fmt.Sprintf("Channel %s does not belong to server %s.", channelID, guildID))
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

	res.GuildPermissions = uint64(access.GuildPermissions(state, member))

	// member.RoleIDs is in no particular order, so the highest role has to be searched for. The
	// @everyone role has the guild's id.
	highestRole, _ := state.Role(guildID)
	for _, roleID := range member.RoleIDs {
		if role, ok := state.Role(roleID); ok && roleBelow(highestRole, role) {
			highestRole = role
		}
	}

	for _, role := range state.Roles {
		if roleBelow(role, highestRole) {
			res.AllowedRoleIDs = append(res.AllowedRoleIDs, role.ID)
		}
	}

	return res, nil
}

// roleBelow orders roles the way Discord does: by position, and on equal positions the role with
// the higher id is the lower one.
func roleBelow(a, b discord.Role) bool {
	if a.Position != b.Position {
		return a.Position < b.Position
	}
	return a.ID > b.ID
}

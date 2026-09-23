package access

import (
	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/guildstate"
)

// permissionSource returns the channel whose overwrites decide access. For a thread that's its
// parent: disgo returns no overwrites for threads at all, so computing permissions from the thread
// itself silently ignores everything the parent allows or denies. Falling back to the thread only
// matters when its parent isn't in the guild's channel list.
func permissionSource(channel discord.GuildChannel, state *guildstate.State) discord.GuildChannel {
	thread, ok := channel.(discord.GuildThread)
	if !ok {
		return channel
	}

	parentID := thread.ParentID()
	if parentID == nil {
		return channel
	}

	for _, candidate := range state.Channels {
		if candidate.ID() == *parentID {
			return candidate
		}
	}

	return channel
}

// maxChannelPermissions ORs the member's permissions over every channel they could send in, which
// is what "has access to this guild" means here. It stops as soon as stopAt is satisfied, so a
// guild with hundreds of channels usually costs a handful of iterations.
func maxChannelPermissions(state *guildstate.State, userID common.ID, roleIDs []common.ID, stopAt discord.Permissions) discord.Permissions {
	var permissions discord.Permissions

	for _, channel := range state.Channels {
		// Categories can't be posted in, so they say nothing about access.
		if channel.Type() == discord.ChannelTypeGuildCategory {
			continue
		}

		permissions |= memberPermissions(&state.Guild, state.Roles, channel, userID, roleIDs)
		if permissions&stopAt == stopAt {
			break
		}
	}

	return permissions
}

func memberPermissions(guild *discord.Guild, roles []discord.Role, channel discord.GuildChannel, userID common.ID, roleIDs []common.ID) (apermissions discord.Permissions) {
	if userID == guild.OwnerID {
		apermissions = discord.PermissionsAll
		return
	}

	for _, role := range roles {
		if role.ID == guild.ID {
			apermissions |= role.Permissions
			break
		}
	}

	for _, role := range roles {
		for _, roleID := range roleIDs {
			if role.ID == roleID {
				apermissions |= role.Permissions
				break
			}
		}
	}

	if apermissions&discord.PermissionAdministrator == discord.PermissionAdministrator {
		apermissions |= discord.PermissionsAll
		return // Administrator bypasses all overrides
	}

	if channel == nil {
		return
	}

	// Apply @everyone overrides from the channel.
	for _, overwrite := range channel.PermissionOverwrites() {
		if roleOverwrite, ok := overwrite.(discord.RolePermissionOverwrite); ok {
			if guild.ID == roleOverwrite.ID() {
				apermissions &= ^roleOverwrite.Deny
				apermissions |= roleOverwrite.Allow
				break
			}
		}
	}

	var denies, allows discord.Permissions
	// Member overwrites can override role overrides, so do two passes
	for _, overwrite := range channel.PermissionOverwrites() {
		if roleOverwrite, ok := overwrite.(discord.RolePermissionOverwrite); ok {
			for _, roleID := range roleIDs {
				if roleOverwrite.ID() == roleID {
					denies |= roleOverwrite.Deny
					allows |= roleOverwrite.Allow
					break
				}
			}
		}
	}

	apermissions &= ^denies
	apermissions |= allows

	for _, overwrite := range channel.PermissionOverwrites() {
		if memberOverwrite, ok := overwrite.(discord.MemberPermissionOverwrite); ok {
			if memberOverwrite.ID() == userID {
				apermissions &= ^memberOverwrite.Deny
				apermissions |= memberOverwrite.Allow
				break
			}
		}
	}

	if apermissions&discord.PermissionAdministrator == discord.PermissionAdministrator {
		apermissions |= discord.PermissionsAll
		return apermissions
	}

	// Discord voids every permission in a channel the member can't see, so a role with guild level
	// Manage Webhooks must not keep it in a channel that hides itself from that role.
	if apermissions&discord.PermissionViewChannel == 0 {
		return 0
	}

	return apermissions
}

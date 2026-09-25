package access

import (
	"slices"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/guildstate"
)

// timedOutPermissions is all a timed out member keeps. Owners and administrators are exempt.
const timedOutPermissions = discord.PermissionViewChannel | discord.PermissionReadMessageHistory

func isTimedOut(member discord.Member) bool {
	return member.CommunicationDisabledUntil != nil && member.CommunicationDisabledUntil.After(time.Now())
}

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
func maxChannelPermissions(state *guildstate.State, member discord.Member, stopAt discord.Permissions) discord.Permissions {
	var permissions discord.Permissions

	for _, channel := range state.Channels {
		// Categories can't be posted in, so they say nothing about access.
		if channel.Type() == discord.ChannelTypeGuildCategory {
			continue
		}

		permissions |= memberPermissions(&state.Guild, state.Roles, channel, member)
		if permissions&stopAt == stopAt {
			break
		}
	}

	return permissions
}

// GuildPermissions is the member's guild level permissions, before any channel overwrites.
func GuildPermissions(state *guildstate.State, member discord.Member) discord.Permissions {
	return memberPermissions(&state.Guild, state.Roles, nil, member)
}

// memberPermissions follows Discord's algorithm. A nil channel gives the guild level permissions.
func memberPermissions(guild *discord.Guild, roles []discord.Role, channel discord.GuildChannel, member discord.Member) discord.Permissions {
	if member.User.ID == guild.OwnerID {
		return discord.PermissionsAll
	}

	var permissions discord.Permissions
	for _, role := range roles {
		if role.ID == guild.ID || slices.Contains(member.RoleIDs, role.ID) {
			permissions |= role.Permissions
		}
	}

	// Administrator bypasses overwrites and timeouts.
	if permissions.Has(discord.PermissionAdministrator) {
		return discord.PermissionsAll
	}

	if channel != nil {
		permissions = applyOverwrites(permissions, guild.ID, channel, member)

		// Discord voids every permission in a channel the member can't see, so a role with guild level
		// Manage Webhooks must not keep it in a channel that hides itself from that role.
		if !permissions.Has(discord.PermissionViewChannel) {
			return 0
		}
	}

	if isTimedOut(member) {
		permissions &= timedOutPermissions
	}

	return permissions
}

func applyOverwrites(permissions discord.Permissions, guildID common.ID, channel discord.GuildChannel, member discord.Member) discord.Permissions {
	overwrites := channel.PermissionOverwrites()

	if overwrite, ok := overwrites.Role(guildID); ok {
		permissions &= ^overwrite.Deny
		permissions |= overwrite.Allow
	}

	// Role overwrites are combined before applying, so an allow on any role beats a deny on another.
	var denies, allows discord.Permissions
	for _, roleID := range member.RoleIDs {
		if overwrite, ok := overwrites.Role(roleID); ok {
			denies |= overwrite.Deny
			allows |= overwrite.Allow
		}
	}
	permissions &= ^denies
	permissions |= allows

	if overwrite, ok := overwrites.Member(member.User.ID); ok {
		permissions &= ^overwrite.Deny
		permissions |= overwrite.Allow
	}

	return permissions
}

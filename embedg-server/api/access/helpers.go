package access

import (
	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

func memberPermissions(guild *discord.Guild, roles []discord.Role, channel discord.GuildChannel, userID util.ID, roleIDs []util.ID) (apermissions discord.Permissions) {
	if userID == guild.OwnerID {
		apermissions = discordgo.PermissionAll
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

	if apermissions&discordgo.PermissionAdministrator == discordgo.PermissionAdministrator {
		apermissions |= discordgo.PermissionAll
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

	if apermissions&discordgo.PermissionAdministrator == discordgo.PermissionAdministrator {
		apermissions |= discordgo.PermissionAll
	}

	return apermissions
}

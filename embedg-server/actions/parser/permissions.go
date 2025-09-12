package parser

import (
	"context"
	"errors"
	"fmt"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/rest"
)

func (m *ActionParser) DerivePermissionsForActions(ctx context.Context, userID string, guildID string, channelID string) (actions.ActionDerivedPermissions, error) {
	res := actions.ActionDerivedPermissions{
		UserID: userID,
	}

	var channel *discordgo.Channel
	if channelID != "" {
		var err error
		channel, err = m.rest.Channel(ctx, channelID)
		if err != nil {
			return res, err
		}

		if channel.GuildID != guildID {
			return res, fmt.Errorf("Channel %s does not belong to guild %s", channelID, guildID)
		}
	}

	guild, err := m.rest.Guild(ctx, guildID)
	if err != nil {
		return res, err
	}

	res.GuildIsOwner = guild.OwnerID == userID

	if channelID != "" {
		ca, err := m.accessManager.GetChannelAccess(ctx, userID, channelID)
		if err != nil {
			return res, err
		}
		res.ChannelPermissions = ca.UserPermissions
	}

	member, err := m.rest.GuildMember(ctx, guildID, userID)
	if err != nil {
		if errors.Is(err, rest.ErrNotFound) {
			return res, fmt.Errorf("member not found: %w", err)
		}
		return res, err
	}

	highestRolePosition := 0

	roles, err := m.rest.GuildRoles(ctx, guildID)
	if err != nil {
		return res, err
	}

	roleMap := make(map[string]*discordgo.Role)
	for _, role := range roles {
		roleMap[role.ID] = role
	}

	defaultRole, ok := roleMap[guildID]
	if ok {
		highestRolePosition = defaultRole.Position
		res.GuildPermissions = defaultRole.Permissions
	}

	for _, roleID := range member.Roles {
		role, ok := roleMap[roleID]
		if ok && role.Position > highestRolePosition {
			highestRolePosition = role.Position
			res.GuildPermissions |= role.Permissions
		}
	}

	for _, role := range guild.Roles {
		if role.Position < highestRolePosition {
			res.AllowedRoleIDs = append(res.AllowedRoleIDs, role.ID)
		}
	}

	return res, nil
}

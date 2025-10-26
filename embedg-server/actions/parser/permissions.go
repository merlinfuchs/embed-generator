package parser

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

func (m *ActionParser) CheckPermissionsForActionSets(actionSets map[string]actions.ActionSet, userID util.ID, guildID util.ID, channelID util.ID) error {
	if channelID != 0 {
		channel, ok := m.caches.Channel(channelID)
		if !ok {
			return fmt.Errorf("channel not found in cache")
		}

		if channel.GuildID() != guildID {
			return fmt.Errorf("Channel %s does not belong to guild %s", channelID, guildID)
		}
	}

	guild, ok := m.caches.Guild(guildID)
	if !ok {
		return fmt.Errorf("guild not found in cache")
	}

	var channelAccess *access.ChannelAccess
	if channelID != 0 {
		ca, err := m.accessManager.GetChannelAccessForUser(userID, channelID)
		if err != nil {
			return err
		}
		channelAccess = &ca

		if !channelAccess.UserAccess() {
			return fmt.Errorf("You have no access to the channel %s", channelID)
		}
	}

	member, err := m.accessManager.GetGuildMember(guildID, userID)
	if err != nil {
		return err
	}

	memberIsOwner := guild.OwnerID == userID

	highestRolePosition := 0
	var permissions discord.Permissions

	defaultRole, ok := m.caches.Role(guildID, guildID)
	if ok {
		highestRolePosition = defaultRole.Position
		permissions = defaultRole.Permissions
	}

	for _, roleID := range member.RoleIDs {
		role, ok := m.caches.Role(guildID, roleID)
		if ok && role.Position > highestRolePosition {
			highestRolePosition = role.Position
			permissions |= role.Permissions
		}
	}

	if channelAccess != nil {
		permissions = channelAccess.UserPermissions
	}

	var checkActions func(actionSets map[string]actions.ActionSet, nestingLevel int) error

	checkActions = func(actionSets map[string]actions.ActionSet, nestingLevel int) error {
		if nestingLevel > 5 {
			return fmt.Errorf("You can't nest more than 5 saved messages with actions")
		}

		for _, actionSet := range actionSets {
			for _, action := range actionSet.Actions {
				switch action.Type {
				case actions.ActionTypeTextResponse, actions.ActionTypeTextDM, actions.ActionTypeTextEdit:
					break
				case actions.ActionTypeAddRole, actions.ActionTypeRemoveRole, actions.ActionTypeToggleRole:
					if permissions&discordgo.PermissionManageRoles == 0 {
						return fmt.Errorf("You have no permission to manage roles in the channel %s", channelID)
					}

					roleID, err := util.ParseID(action.TargetID)
					if err != nil {
						return fmt.Errorf("Invalid role ID: %s", action.TargetID)
					}

					role, ok := m.caches.Role(guildID, roleID)
					if !ok {
						return fmt.Errorf("Role %s does not exist", action.TargetID)
					}

					if !memberIsOwner && role.Position >= highestRolePosition {
						return fmt.Errorf("You can not assign the role %s", action.TargetID)
					}
					break
				case actions.ActionTypeSavedMessageResponse, actions.ActionTypeSavedMessageDM, actions.ActionTypeSavedMessageEdit:
					msg, err := m.pg.Q.GetSavedMessageForGuild(context.TODO(), pgmodel.GetSavedMessageForGuildParams{
						GuildID: sql.NullString{Valid: true, String: guildID.String()},
						ID:      action.TargetID,
					})
					if err != nil {
						if err == sql.ErrNoRows {
							return fmt.Errorf("Saved message %s does not exist or belongs to a different server", action.TargetID)
						}
						return err
					}

					data := &actions.MessageWithActions{}
					err = json.Unmarshal(msg.Data, data)
					if err != nil {
						return err
					}

					return checkActions(data.Actions, nestingLevel+1)
				}
			}
		}

		return nil
	}

	return checkActions(actionSets, 0)
}

func (m *ActionParser) DerivePermissionsForActions(userID util.ID, guildID util.ID, channelID util.ID) (actions.ActionDerivedPermissions, error) {
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
		ca, err := m.accessManager.GetChannelAccessForUser(userID, channelID)
		if err != nil {
			return res, err
		}
		res.ChannelPermissions = ca.UserPermissions
	}

	member, err := m.accessManager.GetGuildMember(guildID, userID)
	if err != nil {
		return res, err
	}

	highestRolePosition := 0

	defaultRole, ok := m.caches.Role(guildID, guildID)
	if ok {
		highestRolePosition = defaultRole.Position
		res.GuildPermissions = defaultRole.Permissions
	}

	for _, roleID := range member.RoleIDs {
		role, ok := m.caches.Role(guildID, roleID)
		if ok && role.Position > highestRolePosition {
			highestRolePosition = role.Position
			res.GuildPermissions |= role.Permissions
		}
	}

	for role := range m.caches.Roles(guildID) {
		if role.Position < highestRolePosition {
			res.AllowedRoleIDs = append(res.AllowedRoleIDs, role.ID)
		}
	}

	return res, nil
}

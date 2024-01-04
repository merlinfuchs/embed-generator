package parser

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"github.com/sqlc-dev/pqtype"
)

type ActionParser struct {
	accessManager *access.AccessManager
	pg            *postgres.PostgresStore
	state         *discordgo.State
}

func New(accessManager *access.AccessManager, pg *postgres.PostgresStore, state *discordgo.State) *ActionParser {
	return &ActionParser{
		accessManager: accessManager,
		pg:            pg,
		state:         state,
	}
}

func (m *ActionParser) ParseMessageComponents(data []actions.ActionRowWithActions) ([]discordgo.MessageComponent, error) {
	components := make([]discordgo.MessageComponent, len(data))

	for i, row := range data {
		ar := discordgo.ActionsRow{
			Components: make([]discordgo.MessageComponent, len(row.Components)),
		}

		for y, component := range row.Components {
			var emoji *discordgo.ComponentEmoji
			if component.Emoji != nil {
				emoji = component.Emoji
			}

			if component.Type == discordgo.ButtonComponent {
				if component.Style == discordgo.LinkButton {
					ar.Components[y] = discordgo.Button{
						Label:    component.Label,
						Style:    component.Style,
						Disabled: component.Disabled,
						URL:      component.URL,
						Emoji:    emoji,
					}
				} else {
					ar.Components[y] = discordgo.Button{
						CustomID: "action:" + component.ActionSetID,
						Label:    component.Label,
						Style:    component.Style,
						Disabled: component.Disabled,
						Emoji:    emoji,
					}
				}
			} else if component.Type == discordgo.SelectMenuComponent {
				options := make([]discordgo.SelectMenuOption, len(component.Options))
				for x, option := range component.Options {
					var emoji discordgo.ComponentEmoji
					if option.Emoji != nil {
						emoji = *option.Emoji
					}

					options[x] = discordgo.SelectMenuOption{
						Label:       option.Label,
						Value:       "action:" + option.ActionSetID,
						Description: option.Description,
						Default:     option.Default,
						Emoji:       emoji,
					}
				}

				ar.Components[y] = discordgo.SelectMenu{
					MenuType:    discordgo.StringSelectMenu,
					CustomID:    "action:options:" + util.UniqueID(),
					Placeholder: component.Placeholder,
					MinValues:   component.MinValues,
					MaxValues:   component.MaxValues,
					Options:     options,
					Disabled:    component.Disabled,
				}
			}
		}

		components[i] = ar
	}

	return components, nil
}

func (m *ActionParser) CheckPermissionsForActionSets(actionSets map[string]actions.ActionSet, userID string, guildID string, channelID string) error {
	var channel *discordgo.Channel
	if channelID != "" {
		var err error
		channel, err = m.state.Channel(channelID)
		if err != nil {
			return err
		}

		if channel.GuildID != guildID {
			return fmt.Errorf("Channel %s does not belong to guild %s", channelID, guildID)
		}
	}

	guild, err := m.state.Guild(guildID)
	if err != nil {
		return err
	}

	var channelAccess *access.ChannelAccess
	if channelID != "" {
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
	var permissions int64

	defaultRole, err := m.state.Role(guildID, guildID)
	if err == nil {
		highestRolePosition = defaultRole.Position
		permissions = defaultRole.Permissions
	}

	for _, roleID := range member.Roles {
		role, err := m.state.Role(guildID, roleID)
		if err == nil && role.Position > highestRolePosition {
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

					role, err := m.state.Role(guildID, action.TargetID)
					if err != nil {
						if err == discordgo.ErrStateNotFound {
							return fmt.Errorf("Role %s does not exist", action.TargetID)
						}
						return err
					}

					if !memberIsOwner && role.Position >= highestRolePosition {
						return fmt.Errorf("You can not assign the role %s", action.TargetID)
					}
					break
				case actions.ActionTypeSavedMessageResponse, actions.ActionTypeSavedMessageDM, actions.ActionTypeSavedMessageEdit:
					msg, err := m.pg.Q.GetSavedMessageForGuild(context.TODO(), postgres.GetSavedMessageForGuildParams{
						GuildID: sql.NullString{Valid: true, String: guildID},
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

func (m *ActionParser) DerivePermissionsForActions(userID string, guildID string, channelID string) (actions.ActionDerivedPermissions, error) {
	res := actions.ActionDerivedPermissions{
		UserID: userID,
	}

	var channel *discordgo.Channel
	if channelID != "" {
		var err error
		channel, err = m.state.Channel(channelID)
		if err != nil {
			return res, err
		}

		if channel.GuildID != guildID {
			return res, fmt.Errorf("Channel %s does not belong to guild %s", channelID, guildID)
		}
	}

	guild, err := m.state.Guild(guildID)
	if err != nil {
		return res, err
	}

	res.GuildIsOwner = guild.OwnerID == userID

	if channelID != "" {
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

	defaultRole, err := m.state.Role(guildID, guildID)
	if err == nil {
		highestRolePosition = defaultRole.Position
		res.GuildPermissions = defaultRole.Permissions
	}

	for _, roleID := range member.Roles {
		role, err := m.state.Role(guildID, roleID)
		if err == nil && role.Position > highestRolePosition {
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

func (m *ActionParser) CreateActionsForMessage(actionSets map[string]actions.ActionSet, derivedPerms actions.ActionDerivedPermissions, messageID string, ephemeral bool) error {
	err := m.pg.Q.DeleteMessageActionSetsForMessage(context.TODO(), messageID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to delete message action sets")
	}

	rawDerivedPerms, err := json.Marshal(derivedPerms)
	if err != nil {
		return fmt.Errorf("Failed to marshal permission context: %w", err)
	}

	for actionSetID, actionSet := range actionSets {
		raw, err := json.Marshal(actionSet)
		if err != nil {
			return err
		}

		_, err = m.pg.Q.InsertMessageActionSet(context.TODO(), postgres.InsertMessageActionSetParams{
			ID:                 util.UniqueID(),
			MessageID:          messageID,
			SetID:              actionSetID,
			Actions:            raw,
			DerivedPermissions: pqtype.NullRawMessage{Valid: true, RawMessage: rawDerivedPerms},
			Ephemeral:          ephemeral,
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to insert message action set")
		}
	}
	return nil
}

func (m *ActionParser) DeleteActionsForMessage(messageID string) error {
	return nil
}

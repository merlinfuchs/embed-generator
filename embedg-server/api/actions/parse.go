package actions

import (
	"encoding/json"
	"fmt"

	"github.com/bwmarrin/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

func (m *ActionManager) ParseMessageComponentActions(raw json.RawMessage, userID string, channelID string) ([]discordgo.MessageComponent, []ActionSet, error) {
	data := MessageWithActions{}
	err := json.Unmarshal(raw, &data)
	if err != nil {
		return nil, nil, err
	}

	components := make([]discordgo.MessageComponent, len(data.Components))
	actionSets := make([]ActionSet, 0)

	for i, row := range data.Components {
		ar := discordgo.ActionsRow{
			Components: make([]discordgo.MessageComponent, len(row.Components)),
		}

		for y, component := range row.Components {
			customID := util.UniqueID()

			err := m.checkPermissionsForActions(component.Actions, userID, channelID)
			if err != nil {
				return nil, nil, err
			}

			actionSet := ActionSet{
				ID:      customID,
				Actions: make([]Action, len(component.Actions)),
			}

			for x, action := range component.Actions {
				actionSet.Actions[x] = action
			}

			if component.Type == discordgo.ButtonComponent {
				ar.Components[y] = discordgo.Button{
					CustomID: "action:" + customID,
					Label:    component.Label,
					Style:    component.Style,
					Disabled: component.Disabled,
					URL:      component.URL,
				}
			} else if component.Type == discordgo.SelectMenuComponent {
				ar.Components[y] = discordgo.SelectMenu{
					MenuType:    discordgo.StringSelectMenu,
					CustomID:    "action:" + customID,
					Placeholder: component.Placeholder,
					MinValues:   component.MinValues,
					MaxValues:   component.MaxValues,
					Options:     component.Options,
					Disabled:    component.Disabled,
				}
			}
		}

		components[i] = ar
	}

	return components, actionSets, nil
}

func (m *ActionManager) checkPermissionsForActions(actions []Action, userID string, channelID string) error {
	channel, err := m.bot.State.Channel(channelID)
	if err != nil {
		return err
	}

	channelAccess, err := m.accessManager.GetChannelAccessForUser(userID, channelID)
	if err != nil {
		return err
	}

	member, err := m.accessManager.GetGuildMember(channel.GuildID, userID)
	if err != nil {
		return err
	}

	highestRolePosition := 0
	for _, roleID := range member.Roles {
		role, err := m.bot.State.Role(channel.GuildID, roleID)
		if err == nil && role.Position > highestRolePosition {
			highestRolePosition = role.Position
		}
	}

	if !channelAccess.UserAccess() {
		return fmt.Errorf("user %s has no access to channel %s", userID, channelID)
	}

	for _, action := range actions {
		switch action.Type {
		case ActionTypeTextResponse:
			break
		case ActionTypeAddRole, ActionTypeRemoveRole, ActionTypeToggleRole:
			if channelAccess.UserPermissions&discordgo.PermissionManageRoles == 0 {
				return fmt.Errorf("user %s has no permission to manage roles in channel %s", userID, channelID)
			}

			role, err := m.bot.State.Role(channel.GuildID, action.TargetID)
			if err != nil {
				if err == discordgo.ErrStateNotFound {
					return fmt.Errorf("role %s does not exist", action.TargetID)
				}
				return err
			}

			if role.Position >= highestRolePosition {
				return fmt.Errorf("user can not assign role %s", action.TargetID)
			}

			break
		}
	}

	return nil
}

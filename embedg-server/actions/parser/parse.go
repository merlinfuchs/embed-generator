package parser

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

type ActionParser struct {
	accessManager *access.AccessManager
	pg            *postgres.PostgresStore
	bot           *bot.Bot
}

func New(accessManager *access.AccessManager, pg *postgres.PostgresStore, bot *bot.Bot) *ActionParser {
	return &ActionParser{
		accessManager: accessManager,
		pg:            pg,
		bot:           bot,
	}
}

func (m *ActionParser) ParseMessageComponents(data []actions.ActionRowWithActions) ([]discordgo.MessageComponent, error) {
	components := make([]discordgo.MessageComponent, len(data))

	for i, row := range data {
		ar := discordgo.ActionsRow{
			Components: make([]discordgo.MessageComponent, len(row.Components)),
		}

		for y, component := range row.Components {
			if component.Type == discordgo.ButtonComponent {
				if component.Style == discordgo.LinkButton {
					ar.Components[y] = discordgo.Button{
						Label:    component.Label,
						Style:    component.Style,
						Disabled: component.Disabled,
						URL:      component.URL,
					}
				} else {
					ar.Components[y] = discordgo.Button{
						CustomID: "action:" + component.ActionSetID,
						Label:    component.Label,
						Style:    component.Style,
						Disabled: component.Disabled,
					}
				}
			} else if component.Type == discordgo.SelectMenuComponent {
				options := make([]discordgo.SelectMenuOption, len(component.Options))
				for x, option := range component.Options {
					options[x] = discordgo.SelectMenuOption{
						Label:       option.Label,
						Value:       "action:" + option.ActionSetID,
						Description: option.Description,
						Default:     option.Default,
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

func (m *ActionParser) CheckPermissionsForActionSets(actionSets map[string]actions.ActionSet, userID string, channelID string) error {
	channel, err := m.bot.State.Channel(channelID)
	if err != nil {
		return err
	}

	guild, err := m.bot.State.Guild(channel.GuildID)
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

	memberIsOwner := guild.OwnerID == userID

	highestRolePosition := 0
	for _, roleID := range member.Roles {
		role, err := m.bot.State.Role(channel.GuildID, roleID)
		if err == nil && role.Position > highestRolePosition {
			highestRolePosition = role.Position
		}
	}

	if !channelAccess.UserAccess() {
		return fmt.Errorf("You have no access to the channel %s", channelID)
	}

	for _, actionSet := range actionSets {
		for _, action := range actionSet.Actions {
			switch action.Type {
			case actions.ActionTypeTextResponse:
				break
			case actions.ActionTypeAddRole, actions.ActionTypeRemoveRole, actions.ActionTypeToggleRole:
				if channelAccess.UserPermissions&discordgo.PermissionManageRoles == 0 {
					return fmt.Errorf("You have no permission to manage roles in the channel %s", channelID)
				}

				role, err := m.bot.State.Role(channel.GuildID, action.TargetID)
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
			}
		}
	}

	return nil
}

func (m *ActionParser) CreateActionsForMessage(actionSets map[string]actions.ActionSet, messageID string) error {
	for actionSetID, actionSet := range actionSets {
		raw, err := json.Marshal(actionSet)
		if err != nil {
			return err
		}

		m.pg.Q.InsertMessageActionSet(context.TODO(), postgres.InsertMessageActionSetParams{
			ID:        util.UniqueID(),
			MessageID: messageID,
			SetID:     actionSetID,
			Actions:   raw,
		})
	}
	return nil
}

func (m *ActionParser) DeleteActionsForMessage(messageID string) error {
	return nil
}

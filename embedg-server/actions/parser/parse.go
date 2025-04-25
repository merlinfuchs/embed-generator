package parser

import (
	"strings"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
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

func (m *ActionParser) ParseMessageComponents(data []actions.ComponentWithActions) ([]discordgo.MessageComponent, error) {
	components := make([]discordgo.MessageComponent, 0, len(data))

	for _, row := range data {
		if row.Type == discordgo.ActionsRowComponent {
			ar := discordgo.ActionsRow{
				ID:         row.ID,
				Components: make([]discordgo.MessageComponent, 0, len(row.Components)),
			}

			for _, component := range row.Components {
				if component.Type == discordgo.ButtonComponent {
					if component.Style == discordgo.LinkButton {
						ar.Components = append(ar.Components, discordgo.Button{
							ID:       component.ID,
							Label:    component.Label,
							Style:    component.Style,
							Disabled: component.Disabled,
							URL:      component.URL,
							Emoji:    component.Emoji,
						})
					} else {
						ar.Components = append(ar.Components, discordgo.Button{
							ID:       component.ID,
							CustomID: "action:" + component.ActionSetID,
							Label:    component.Label,
							Style:    component.Style,
							Disabled: component.Disabled,
							Emoji:    component.Emoji,
						})
					}
				} else if component.Type == discordgo.SelectMenuComponent {
					options := make([]discordgo.SelectMenuOption, len(component.Options))
					for x, option := range component.Options {
						options[x] = discordgo.SelectMenuOption{
							Label:       option.Label,
							Value:       "action:" + option.ActionSetID,
							Description: option.Description,
							Default:     option.Default,
							Emoji:       option.Emoji,
						}
					}

					ar.Components = append(ar.Components, discordgo.SelectMenu{
						ID:          component.ID,
						MenuType:    discordgo.StringSelectMenu,
						CustomID:    "action:options:" + util.UniqueID(),
						Placeholder: component.Placeholder,
						MinValues:   component.MinValues,
						MaxValues:   component.MaxValues,
						Options:     options,
						Disabled:    component.Disabled,
					})
				}
			}

			components = append(components, ar)
		}

		// TODO: Handle v2 components
	}

	return components, nil
}

func (m *ActionParser) UnparseMessageComponents(data []discordgo.MessageComponent) ([]actions.ComponentWithActions, error) {
	res := make([]actions.ComponentWithActions, 0, len(data))

	for _, comp := range data {
		row, ok := comp.(*discordgo.ActionsRow)
		if !ok {
			continue
		}

		ar := actions.ComponentWithActions{
			Components: make([]actions.ComponentWithActions, 0, len(row.Components)),
		}

		for _, comp := range row.Components {
			switch c := comp.(type) {
			case *discordgo.Button:
				ar.Components = append(ar.Components, actions.ComponentWithActions{
					Type:        discordgo.ButtonComponent,
					Disabled:    c.Disabled,
					Style:       c.Style,
					Label:       c.Label,
					Emoji:       c.Emoji,
					URL:         c.URL,
					ActionSetID: strings.TrimPrefix(c.CustomID, "action:"),
				})
			case *discordgo.SelectMenu:
				options := make([]actions.ComponentSelectOptionWithActions, 0, len(c.Options))
				for _, option := range c.Options {
					options = append(options, actions.ComponentSelectOptionWithActions{
						Label:       option.Label,
						Description: option.Description,
						Emoji:       option.Emoji,
						Default:     option.Default,
						ActionSetID: strings.TrimPrefix(option.Value, "action:"),
					})
				}

				ar.Components = append(ar.Components, actions.ComponentWithActions{
					Type:        discordgo.SelectMenuComponent,
					Disabled:    c.Disabled,
					Placeholder: c.Placeholder,
					MinValues:   c.MinValues,
					MaxValues:   c.MaxValues,
					Options:     options,
				})
			}
		}

		res = append(res, ar)
	}

	return res, nil
}

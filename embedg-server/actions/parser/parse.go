package parser

import (
	"errors"
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

	for _, component := range data {
		parsed, err := m.ParseMessageComponent(component)
		if err != nil {
			return nil, err
		}

		components = append(components, parsed)
	}

	return components, nil
}

func (m *ActionParser) ParseMessageComponent(data actions.ComponentWithActions) (discordgo.MessageComponent, error) {
	switch data.Type {
	case discordgo.ActionsRowComponent:
		ar := discordgo.ActionsRow{
			ID:         data.ID,
			Components: make([]discordgo.MessageComponent, 0, len(data.Components)),
		}

		for _, component := range data.Components {
			parsed, err := m.ParseMessageComponent(component)
			if err != nil {
				return nil, err
			}

			ar.Components = append(ar.Components, parsed)
		}

		return ar, nil
	case discordgo.ButtonComponent:
		if data.Style == discordgo.LinkButton {
			return discordgo.Button{
				ID:       data.ID,
				Label:    data.Label,
				Style:    data.Style,
				Disabled: data.Disabled,
				URL:      data.URL,
				Emoji:    data.Emoji,
			}, nil
		} else {
			return discordgo.Button{
				ID:       data.ID,
				CustomID: "action:" + data.ActionSetID,
				Label:    data.Label,
				Style:    data.Style,
				Disabled: data.Disabled,
				Emoji:    data.Emoji,
			}, nil
		}
	case discordgo.SelectMenuComponent:
		options := make([]discordgo.SelectMenuOption, len(data.Options))
		for x, option := range data.Options {
			options[x] = discordgo.SelectMenuOption{
				Label:       option.Label,
				Value:       "action:" + option.ActionSetID,
				Description: option.Description,
				Default:     option.Default,
				Emoji:       option.Emoji,
			}
		}

		return discordgo.SelectMenu{
			ID:          data.ID,
			MenuType:    discordgo.StringSelectMenu,
			CustomID:    "action:options:" + util.UniqueID(),
			Placeholder: data.Placeholder,
			MinValues:   data.MinValues,
			MaxValues:   data.MaxValues,
			Options:     options,
			Disabled:    data.Disabled,
		}, nil
	case discordgo.SectionComponent:
		se := discordgo.Section{
			ID:         data.ID,
			Components: make([]discordgo.MessageComponent, 0, len(data.Components)),
		}

		for _, component := range data.Components {
			parsed, err := m.ParseMessageComponent(component)
			if err != nil {
				return nil, err
			}

			se.Components = append(se.Components, parsed)
		}

		if data.Accessory != nil {
			parsed, err := m.ParseMessageComponent(*data.Accessory)
			if err != nil {
				return nil, err
			}
			se.Accessory = parsed
		}

		return se, nil
	case discordgo.TextDisplayComponent:
		return discordgo.TextDisplay{
			ID:      data.ID,
			Content: data.Content,
		}, nil
	case discordgo.ThumbnailComponent:
		if data.Media == nil {
			return nil, errors.New("media is required for thumbnail component")
		}

		return discordgo.Thumbnail{
			ID:          data.ID,
			Content:     data.Content,
			Media:       discordgo.UnfurledMediaItem{URL: data.Media.URL},
			Description: data.Description,
			Spoiler:     data.Spoiler,
		}, nil
	case discordgo.MediaGalleryComponent:
		items := make([]discordgo.MediaGalleryItem, len(data.Items))
		for x, item := range data.Items {
			items[x] = discordgo.MediaGalleryItem{
				Media:       discordgo.UnfurledMediaItem{URL: item.Media.URL},
				Description: item.Description,
				Spoiler:     item.Spoiler,
			}
		}

		return discordgo.MediaGallery{
			ID:    data.ID,
			Items: items,
		}, nil
	case discordgo.FileComponent:
		if data.File == nil {
			return nil, errors.New("file is required for file component")
		}

		return discordgo.ComponentFile{
			ID:      data.ID,
			Content: data.Content,
			File:    discordgo.UnfurledMediaItem{URL: data.File.URL},
			Spoiler: data.Spoiler,
		}, nil
	case discordgo.SeparatorComponent:
		return discordgo.Separator{
			ID:      data.ID,
			Divider: data.Divider,
			Spacing: data.Spacing,
		}, nil
	case discordgo.ContainerComponent:
		c := discordgo.Container{
			ID:          data.ID,
			Content:     data.Content,
			Components:  make([]discordgo.MessageComponent, 0, len(data.Components)),
			AccentColor: data.AccentColor,
			Spoiler:     data.Spoiler,
		}

		for _, component := range data.Components {
			parsed, err := m.ParseMessageComponent(component)
			if err != nil {
				return nil, err
			}

			c.Components = append(c.Components, parsed)
		}

		return c, nil
	default:
		return nil, errors.New("invalid component type")
	}
}

func (m *ActionParser) UnparseMessageComponents(data []discordgo.MessageComponent) ([]actions.ComponentWithActions, error) {
	res := make([]actions.ComponentWithActions, 0, len(data))

	for _, comp := range data {
		row, ok := comp.(*discordgo.ActionsRow)
		if !ok {
			continue
		}

		// TODO: v2 component types

		ar := actions.ComponentWithActions{
			Type:       discordgo.ActionsRowComponent,
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

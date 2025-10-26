package parser

import (
	"errors"
	"fmt"
	"slices"
	"strings"

	"github.com/disgoorg/disgo/cache"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

type ActionParser struct {
	accessManager *access.AccessManager
	pg            *postgres.PostgresStore
	caches        cache.Caches
}

func New(accessManager *access.AccessManager, pg *postgres.PostgresStore, caches cache.Caches) *ActionParser {
	return &ActionParser{
		accessManager: accessManager,
		pg:            pg,
		caches:        caches,
	}
}

func (m *ActionParser) ParseMessageComponents(data []actions.ComponentWithActions, allowedComponentTypes []int) ([]discordgo.MessageComponent, error) {
	components := make([]discordgo.MessageComponent, 0, len(data))

	for _, component := range data {
		parsed, err := m.ParseMessageComponent(component, allowedComponentTypes)
		if err != nil {
			return nil, err
		}

		components = append(components, parsed)
	}

	return components, nil
}

func (m *ActionParser) ParseMessageComponent(data actions.ComponentWithActions, allowedComponentTypes []int) (discordgo.MessageComponent, error) {
	if !slices.Contains(allowedComponentTypes, int(data.Type)) {
		return nil, fmt.Errorf("component type %d not allowed, you need to upgrade to a premium plan to use this component", data.Type)
	}

	switch data.Type {
	case discordgo.ActionsRowComponent:
		ar := discordgo.ActionsRow{
			ID:         data.ID,
			Components: make([]discordgo.MessageComponent, 0, len(data.Components)),
		}

		for _, component := range data.Components {
			parsed, err := m.ParseMessageComponent(component, allowedComponentTypes)
			if err != nil {
				return nil, err
			}

			ar.Components = append(ar.Components, parsed)
		}

		return ar, nil
	case discordgo.ButtonComponent:
		if data.Style == discordgo.LinkButton {
			return discordgo.Button{
				Label:    data.Label,
				Style:    data.Style,
				Disabled: data.Disabled,
				URL:      data.URL,
				Emoji:    data.Emoji,
			}, nil
		} else {
			return discordgo.Button{
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
			Components: make([]discordgo.MessageComponent, 0, len(data.Components)),
		}

		for _, component := range data.Components {
			parsed, err := m.ParseMessageComponent(component, allowedComponentTypes)
			if err != nil {
				return nil, err
			}

			se.Components = append(se.Components, parsed)
		}

		if data.Accessory != nil {
			parsed, err := m.ParseMessageComponent(*data.Accessory, allowedComponentTypes)
			if err != nil {
				return nil, err
			}
			se.Accessory = parsed
		}

		return se, nil
	case discordgo.TextDisplayComponent:
		return discordgo.TextDisplay{
			Content: data.Content,
		}, nil
	case discordgo.ThumbnailComponent:
		if data.Media == nil {
			return nil, errors.New("media is required for thumbnail component")
		}

		var description *string
		if data.Description != "" {
			description = &data.Description
		}

		return discordgo.Thumbnail{
			Media:       discordgo.UnfurledMediaItem{URL: data.Media.URL},
			Description: description,
			Spoiler:     data.Spoiler,
		}, nil
	case discordgo.MediaGalleryComponent:
		items := make([]discordgo.MediaGalleryItem, len(data.Items))
		for x, item := range data.Items {
			var description *string
			if item.Description != "" {
				description = &item.Description
			}

			items[x] = discordgo.MediaGalleryItem{
				Media:       discordgo.UnfurledMediaItem{URL: item.Media.URL},
				Description: description,
				Spoiler:     item.Spoiler,
			}
		}

		return discordgo.MediaGallery{
			Items: items,
		}, nil
	case discordgo.FileComponentType:
		if data.File == nil {
			return nil, errors.New("file is required for file component")
		}

		return discordgo.FileComponent{
			File:    discordgo.UnfurledMediaItem{URL: data.File.URL},
			Spoiler: data.Spoiler,
		}, nil
	case discordgo.SeparatorComponent:
		var spacing *discordgo.SeparatorSpacingSize
		if data.Spacing != 0 {
			s := discordgo.SeparatorSpacingSize(data.Spacing)
			spacing = &s
		}

		return discordgo.Separator{
			Divider: &data.Divider,
			Spacing: spacing,
		}, nil
	case discordgo.ContainerComponent:
		var accentColor *int
		if data.AccentColor != 0 {
			accentColor = &data.AccentColor
		}

		c := discordgo.Container{
			Components:  make([]discordgo.MessageComponent, 0, len(data.Components)),
			AccentColor: accentColor,
			Spoiler:     data.Spoiler,
		}

		for _, component := range data.Components {
			parsed, err := m.ParseMessageComponent(component, allowedComponentTypes)
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
		parsed, err := m.UnparseMessageComponent(comp)
		if err != nil {
			return nil, err
		}
		res = append(res, parsed)
	}

	return res, nil
}

func (m *ActionParser) UnparseMessageComponent(data discordgo.MessageComponent) (actions.ComponentWithActions, error) {
	switch c := data.(type) {
	case *discordgo.ActionsRow:
		ar := actions.ComponentWithActions{
			Type:       discordgo.ActionsRowComponent,
			Components: make([]actions.ComponentWithActions, 0, len(c.Components)),
		}

		for _, comp := range c.Components {
			parsed, err := m.UnparseMessageComponent(comp)
			if err != nil {
				return actions.ComponentWithActions{}, err
			}
			ar.Components = append(ar.Components, parsed)
		}

		return ar, nil
	case *discordgo.Button:
		return actions.ComponentWithActions{
			Type:        discordgo.ButtonComponent,
			Disabled:    c.Disabled,
			Style:       c.Style,
			Label:       c.Label,
			Emoji:       c.Emoji,
			URL:         c.URL,
			ActionSetID: strings.TrimPrefix(c.CustomID, "action:"),
		}, nil
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

		return actions.ComponentWithActions{
			Type:        discordgo.SelectMenuComponent,
			Disabled:    c.Disabled,
			Placeholder: c.Placeholder,
			MinValues:   c.MinValues,
			MaxValues:   c.MaxValues,
			Options:     options,
		}, nil
	case *discordgo.Section:
		se := actions.ComponentWithActions{
			Type:       discordgo.SectionComponent,
			Components: make([]actions.ComponentWithActions, 0, len(c.Components)),
		}

		for _, comp := range c.Components {
			parsed, err := m.UnparseMessageComponent(comp)
			if err != nil {
				return actions.ComponentWithActions{}, err
			}
			se.Components = append(se.Components, parsed)
		}

		if c.Accessory != nil {
			parsed, err := m.UnparseMessageComponent(c.Accessory)
			if err != nil {
				return actions.ComponentWithActions{}, err
			}
			se.Accessory = &parsed
		}

		return se, nil
	case *discordgo.TextDisplay:
		return actions.ComponentWithActions{
			Type:    discordgo.TextDisplayComponent,
			Content: c.Content,
		}, nil
	case *discordgo.Thumbnail:
		description := ""
		if c.Description != nil {
			description = *c.Description
		}

		return actions.ComponentWithActions{
			Type:        discordgo.ThumbnailComponent,
			Media:       &actions.UnfurledMediaItem{URL: c.Media.URL},
			Description: description,
		}, nil
	case *discordgo.MediaGallery:
		items := make([]actions.ComponentMediaGalleryItem, 0, len(c.Items))
		for _, item := range c.Items {
			var description string
			if item.Description != nil {
				description = *item.Description
			}

			items = append(items, actions.ComponentMediaGalleryItem{
				Media:       actions.UnfurledMediaItem{URL: item.Media.URL},
				Description: description,
				Spoiler:     item.Spoiler,
			})
		}

		return actions.ComponentWithActions{
			Type:  discordgo.MediaGalleryComponent,
			Items: items,
		}, nil
	case *discordgo.FileComponent:
		return actions.ComponentWithActions{
			Type:    discordgo.FileComponentType,
			File:    &actions.UnfurledMediaItem{URL: c.File.URL},
			Spoiler: c.Spoiler,
		}, nil
	case *discordgo.Separator:
		var divider bool
		if c.Divider != nil {
			divider = *c.Divider
		}

		var spacing int
		if c.Spacing != nil {
			spacing = int(*c.Spacing)
		}

		return actions.ComponentWithActions{
			Type:    discordgo.SeparatorComponent,
			Divider: divider,
			Spacing: spacing,
		}, nil
	case *discordgo.Container:
		components := make([]actions.ComponentWithActions, 0, len(c.Components))
		for _, comp := range c.Components {
			parsed, err := m.UnparseMessageComponent(comp)
			if err != nil {
				return actions.ComponentWithActions{}, err
			}
			components = append(components, parsed)
		}

		var accentColor int
		if c.AccentColor != nil {
			accentColor = *c.AccentColor
		}

		return actions.ComponentWithActions{
			Type:        discordgo.ContainerComponent,
			Components:  components,
			AccentColor: accentColor,
			Spoiler:     c.Spoiler,
		}, nil
	default:
		return actions.ComponentWithActions{}, fmt.Errorf("invalid component type: %T", c)
	}
}

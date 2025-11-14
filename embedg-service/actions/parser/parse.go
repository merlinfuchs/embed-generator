package parser

import (
	"errors"
	"fmt"
	"slices"
	"strings"

	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

type ActionParser struct {
	accessManager     *access.AccessManager
	actionSetStore    store.MessageActionSetStore
	savedMessageStore store.SavedMessageStore
	caches            cache.Caches
}

func New(
	accessManager *access.AccessManager,
	actionSetStore store.MessageActionSetStore,
	savedMessageStore store.SavedMessageStore,
	caches cache.Caches,
) *ActionParser {
	return &ActionParser{
		accessManager:     accessManager,
		actionSetStore:    actionSetStore,
		savedMessageStore: savedMessageStore,
		caches:            caches,
	}
}

func (m *ActionParser) ParseMessageComponents(data []actions.ComponentWithActions, allowedComponentTypes []int) ([]discord.LayoutComponent, error) {
	components := make([]discord.LayoutComponent, 0, len(data))

	for _, component := range data {
		parsed, err := m.ParseMessageComponent(component, allowedComponentTypes)
		if err != nil {
			return nil, err
		}

		// Convert to LayoutComponent
		if layoutComp, ok := parsed.(discord.LayoutComponent); ok {
			components = append(components, layoutComp)
		} else {
			return nil, fmt.Errorf("component type %T cannot be used as LayoutComponent", parsed)
		}
	}

	return components, nil
}

func (m *ActionParser) ParseMessageComponent(data actions.ComponentWithActions, allowedComponentTypes []int) (discord.Component, error) {
	if !slices.Contains(allowedComponentTypes, int(data.Type)) {
		return nil, fmt.Errorf("component type %d not allowed, you need to upgrade to a premium plan to use this component", data.Type)
	}

	switch data.Type {
	case discord.ComponentTypeActionRow:
		ar := discord.ActionRowComponent{
			ID:         data.ID,
			Components: make([]discord.InteractiveComponent, 0, len(data.Components)),
		}

		for _, component := range data.Components {
			parsed, err := m.ParseMessageComponent(component, allowedComponentTypes)
			if err != nil {
				return nil, err
			}

			if interactiveComp, ok := parsed.(discord.InteractiveComponent); ok {
				ar.Components = append(ar.Components, interactiveComp)
			} else {
				return nil, fmt.Errorf("component type %T cannot be used as InteractiveComponent", parsed)
			}
		}

		return ar, nil
	case discord.ComponentTypeButton:
		if data.Style == discord.ButtonStyleLink {
			return discord.ButtonComponent{
				Label:    data.Label,
				Style:    data.Style,
				Disabled: data.Disabled,
				URL:      data.URL,
				Emoji:    data.Emoji,
			}, nil
		} else {
			return discord.ButtonComponent{
				CustomID: "action:" + data.ActionSetID,
				Label:    data.Label,
				Style:    data.Style,
				Disabled: data.Disabled,
				Emoji:    data.Emoji,
			}, nil
		}
	case discord.ComponentTypeStringSelectMenu:
		options := make([]discord.StringSelectMenuOption, len(data.Options))
		for x, option := range data.Options {
			options[x] = discord.StringSelectMenuOption{
				Label:       option.Label,
				Value:       "action:" + option.ActionSetID,
				Description: option.Description,
				Default:     option.Default,
				Emoji:       option.Emoji,
			}
		}

		return discord.StringSelectMenuComponent{
			CustomID:    "action:options:" + common.UniqueID().String(),
			Placeholder: data.Placeholder,
			MinValues:   data.MinValues,
			MaxValues:   data.MaxValues,
			Options:     options,
			Disabled:    data.Disabled,
		}, nil
	case discord.ComponentTypeSection:
		se := discord.SectionComponent{
			Components: make([]discord.SectionSubComponent, 0, len(data.Components)),
		}

		for _, component := range data.Components {
			parsed, err := m.ParseMessageComponent(component, allowedComponentTypes)
			if err != nil {
				return nil, err
			}

			if sectionSubComp, ok := parsed.(discord.SectionSubComponent); ok {
				se.Components = append(se.Components, sectionSubComp)
			} else {
				return nil, fmt.Errorf("component type %T cannot be used as SectionSubComponent", parsed)
			}
		}

		if data.Accessory != nil {
			parsed, err := m.ParseMessageComponent(*data.Accessory, allowedComponentTypes)
			if err != nil {
				return nil, err
			}
			if sectionAccessoryComp, ok := parsed.(discord.SectionAccessoryComponent); ok {
				se.Accessory = sectionAccessoryComp
			} else {
				return nil, fmt.Errorf("component type %T cannot be used as SectionAccessoryComponent", parsed)
			}
		}

		return se, nil
	case discord.ComponentTypeTextDisplay:
		return discord.TextDisplayComponent{
			Content: data.Content,
		}, nil
	case discord.ComponentTypeThumbnail:
		if data.Media == nil {
			return nil, errors.New("media is required for thumbnail component")
		}

		return discord.ThumbnailComponent{
			Media:       discord.UnfurledMediaItem{URL: data.Media.URL},
			Description: data.Description,
			Spoiler:     data.Spoiler,
		}, nil
	case discord.ComponentTypeMediaGallery:
		items := make([]discord.MediaGalleryItem, len(data.Items))
		for x, item := range data.Items {
			items[x] = discord.MediaGalleryItem{
				Media:       discord.UnfurledMediaItem{URL: item.Media.URL},
				Description: item.Description,
				Spoiler:     item.Spoiler,
			}
		}

		return discord.MediaGalleryComponent{
			Items: items,
		}, nil
	case discord.ComponentTypeFile:
		if data.File == nil {
			return nil, errors.New("file is required for file component")
		}

		return discord.FileComponent{
			File:    discord.UnfurledMediaItem{URL: data.File.URL},
			Spoiler: data.Spoiler,
		}, nil
	case discord.ComponentTypeSeparator:
		var divider *bool
		if data.Divider {
			divider = &data.Divider
		}

		return discord.SeparatorComponent{
			Divider: divider,
			Spacing: discord.SeparatorSpacingSize(data.Spacing),
		}, nil
	case discord.ComponentTypeContainer:
		c := discord.ContainerComponent{
			Components:  make([]discord.ContainerSubComponent, 0, len(data.Components)),
			AccentColor: data.AccentColor,
			Spoiler:     data.Spoiler,
		}

		for _, component := range data.Components {
			parsed, err := m.ParseMessageComponent(component, allowedComponentTypes)
			if err != nil {
				return nil, err
			}

			if containerSubComp, ok := parsed.(discord.ContainerSubComponent); ok {
				c.Components = append(c.Components, containerSubComp)
			} else {
				return nil, fmt.Errorf("component type %T cannot be used as ContainerSubComponent", parsed)
			}
		}

		return c, nil
	default:
		return nil, errors.New("invalid component type")
	}
}

func (m *ActionParser) UnparseMessageComponents(data []discord.LayoutComponent) ([]actions.ComponentWithActions, error) {
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

func (m *ActionParser) UnparseMessageComponent(data discord.Component) (actions.ComponentWithActions, error) {
	switch c := data.(type) {
	case discord.ActionRowComponent:
		ar := actions.ComponentWithActions{
			Type:       discord.ComponentTypeActionRow,
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
	case discord.ButtonComponent:
		return actions.ComponentWithActions{
			Type:        discord.ComponentTypeButton,
			Disabled:    c.Disabled,
			Style:       c.Style,
			Label:       c.Label,
			Emoji:       c.Emoji,
			URL:         c.URL,
			ActionSetID: strings.TrimPrefix(c.CustomID, "action:"),
		}, nil
	case discord.StringSelectMenuComponent:
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
			Type:        discord.ComponentTypeStringSelectMenu,
			Disabled:    c.Disabled,
			Placeholder: c.Placeholder,
			MinValues:   c.MinValues,
			MaxValues:   c.MaxValues,
			Options:     options,
		}, nil
	case discord.SectionComponent:
		se := actions.ComponentWithActions{
			Type:       discord.ComponentTypeSection,
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
	case discord.TextDisplayComponent:
		return actions.ComponentWithActions{
			Type:    discord.ComponentTypeTextDisplay,
			Content: c.Content,
		}, nil
	case discord.ThumbnailComponent:
		return actions.ComponentWithActions{
			Type:        discord.ComponentTypeThumbnail,
			Media:       &actions.UnfurledMediaItem{URL: c.Media.URL},
			Description: c.Description,
		}, nil
	case discord.MediaGalleryComponent:
		items := make([]actions.ComponentMediaGalleryItem, 0, len(c.Items))
		for _, item := range c.Items {
			items = append(items, actions.ComponentMediaGalleryItem{
				Media:       actions.UnfurledMediaItem{URL: item.Media.URL},
				Description: item.Description,
				Spoiler:     item.Spoiler,
			})
		}

		return actions.ComponentWithActions{
			Type:  discord.ComponentTypeMediaGallery,
			Items: items,
		}, nil
	case discord.FileComponent:
		return actions.ComponentWithActions{
			Type:    discord.ComponentTypeFile,
			File:    &actions.UnfurledMediaItem{URL: c.File.URL},
			Spoiler: c.Spoiler,
		}, nil
	case discord.SeparatorComponent:
		var divider bool
		if c.Divider != nil {
			divider = *c.Divider
		}

		return actions.ComponentWithActions{
			Type:    discord.ComponentTypeSeparator,
			Divider: divider,
			Spacing: int(c.Spacing),
		}, nil
	case discord.ContainerComponent:
		components := make([]actions.ComponentWithActions, 0, len(c.Components))
		for _, comp := range c.Components {
			parsed, err := m.UnparseMessageComponent(comp)
			if err != nil {
				return actions.ComponentWithActions{}, err
			}
			components = append(components, parsed)
		}

		return actions.ComponentWithActions{
			Type:        discord.ComponentTypeContainer,
			Components:  components,
			AccentColor: c.AccentColor,
			Spoiler:     c.Spoiler,
		}, nil
	default:
		return actions.ComponentWithActions{}, fmt.Errorf("invalid component type: %T", c)
	}
}

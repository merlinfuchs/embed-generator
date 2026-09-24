package model

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/url"
	"slices"
	"unicode/utf8"
)

// A component embed replaces the standard link preview with a Components V2
// layout that Discord reads from the page:
// https://discord.com/developers/docs/link-previews/component-embeds
//
// It is a read-only subset of message components: no select menus, no files,
// link buttons only, and no keys beyond the ones listed per type. Discord
// drops the whole payload when it sees anything else, so what goes into the
// page is built from these structs rather than from the bytes a client sent.
type ComponentEmbed struct {
	Component ComponentEmbedComponent `json:"component"`
}

type ComponentEmbedComponent struct {
	Type int `json:"type"`

	// Action row, section and container.
	Components []ComponentEmbedComponent `json:"components,omitempty"`

	// Button.
	Style    int                  `json:"style,omitempty"`
	Label    string               `json:"label,omitempty"`
	URL      string               `json:"url,omitempty"`
	Emoji    *ComponentEmbedEmoji `json:"emoji,omitempty"`
	Disabled bool                 `json:"disabled,omitempty"`

	// Section.
	Accessory *ComponentEmbedComponent `json:"accessory,omitempty"`

	// Text display.
	Content string `json:"content,omitempty"`

	// Thumbnail.
	Media       *ComponentEmbedMedia `json:"media,omitempty"`
	Description string               `json:"description,omitempty"`
	Spoiler     bool                 `json:"spoiler,omitempty"`

	// Media gallery.
	Items []ComponentEmbedGalleryItem `json:"items,omitempty"`

	// Separator.
	Divider *bool `json:"divider,omitempty"`
	Spacing int   `json:"spacing,omitempty"`

	// Container.
	AccentColor *int `json:"accent_color,omitempty"`
}

type ComponentEmbedGalleryItem struct {
	Media       ComponentEmbedMedia `json:"media"`
	Description string              `json:"description,omitempty"`
	Spoiler     bool                `json:"spoiler,omitempty"`
}

type ComponentEmbedMedia struct {
	URL string `json:"url"`
}

type ComponentEmbedEmoji struct {
	ID       string `json:"id,omitempty"`
	Name     string `json:"name,omitempty"`
	Animated bool   `json:"animated,omitempty"`
}

const (
	componentEmbedMaxComponents = 40
	componentEmbedMaxURLLength  = 2048
	// Only the linked variant of the payload has a documented size limit
	// (3,000 bytes). This one is ours, so a link can't carry an arbitrarily
	// large blob into every page render.
	componentEmbedMaxBytes = 16 * 1024
)

// ParseComponentEmbed reads a payload from a client and returns it only if
// Discord would accept it.
func ParseComponentEmbed(raw []byte) (*ComponentEmbed, error) {
	if len(raw) > componentEmbedMaxBytes {
		return nil, fmt.Errorf("component embed is larger than %d bytes", componentEmbedMaxBytes)
	}

	var embed ComponentEmbed
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&embed); err != nil {
		return nil, fmt.Errorf("invalid component embed: %w", err)
	}

	count := 0
	if err := validateComponentEmbedComponent(embed.Component, []int{17}, &count); err != nil {
		return nil, err
	}

	return &embed, nil
}

// What a component may hold: how many children and of which types. A type
// missing from its parent's list invalidates the payload.
var componentEmbedChildren = map[int]struct {
	min, max int
	types    []int
	what     string
}{
	17: {1, 10, []int{1, 9, 10, 12, 14}, "container must have between 1 and 10 components"},
	1:  {1, 5, []int{2}, "button row must have between 1 and 5 buttons"},
	9:  {1, 3, []int{10}, "section must have between 1 and 3 text displays"},
}

var componentEmbedAccessoryTypes = []int{2, 11}

// The keys each component type may carry. Discord drops a payload that holds
// anything else, so a field belonging to another type is rejected rather than
// silently dropped when the payload is written out again.
var componentEmbedFields = map[int][]string{
	1:  {"components"},
	2:  {"style", "label", "url", "emoji", "disabled"},
	9:  {"components", "accessory"},
	10: {"content"},
	11: {"media", "description", "spoiler"},
	12: {"items"},
	14: {"divider", "spacing"},
	17: {"components", "accent_color", "spoiler"},
}

func validateComponentEmbedComponent(c ComponentEmbedComponent, allowedTypes []int, count *int) error {
	*count++
	if *count > componentEmbedMaxComponents {
		return fmt.Errorf("component embed has more than %d components", componentEmbedMaxComponents)
	}

	if !slices.Contains(allowedTypes, c.Type) {
		return fmt.Errorf("component type %d is not allowed here", c.Type)
	}

	if children, ok := componentEmbedChildren[c.Type]; ok {
		if len(c.Components) < children.min || len(c.Components) > children.max {
			return fmt.Errorf("%s", children.what)
		}
		for _, child := range c.Components {
			if err := validateComponentEmbedComponent(child, children.types, count); err != nil {
				return err
			}
		}
	}

	switch c.Type {
	case 17: // container
		if c.AccentColor != nil && (*c.AccentColor < 0 || *c.AccentColor > 0xFFFFFF) {
			return fmt.Errorf("accent color is out of range")
		}
	case 9: // section
		if c.Accessory == nil {
			return fmt.Errorf("section must have an accessory")
		}
		if err := validateComponentEmbedComponent(*c.Accessory, componentEmbedAccessoryTypes, count); err != nil {
			return err
		}
	case 2: // button
		if c.Style != 5 {
			return fmt.Errorf("component embeds only allow link buttons")
		}
		if err := validateComponentEmbedURL(c.URL); err != nil {
			return fmt.Errorf("button url: %w", err)
		}
		if c.Label == "" && c.Emoji == nil {
			return fmt.Errorf("button must have a label or an emoji")
		}
		if utf8.RuneCountInString(c.Label) > 80 {
			return fmt.Errorf("button label is longer than 80 characters")
		}
	case 10: // text display
		if c.Content == "" {
			return fmt.Errorf("text display must have content")
		}
	case 11: // thumbnail
		if c.Media == nil {
			return fmt.Errorf("thumbnail must have media")
		}
		if err := validateComponentEmbedURL(c.Media.URL); err != nil {
			return fmt.Errorf("thumbnail media: %w", err)
		}
	case 12: // media gallery
		if len(c.Items) == 0 || len(c.Items) > 10 {
			return fmt.Errorf("media gallery must have between 1 and 10 items")
		}
		for _, item := range c.Items {
			if err := validateComponentEmbedURL(item.Media.URL); err != nil {
				return fmt.Errorf("media gallery item: %w", err)
			}
		}
	case 14: // separator
		if c.Spacing != 0 && c.Spacing != 1 && c.Spacing != 2 {
			return fmt.Errorf("separator spacing must be 1 or 2")
		}
	}

	return componentEmbedUnusedFields(c)
}

func componentEmbedUnusedFields(c ComponentEmbedComponent) error {
	allowed := componentEmbedFields[c.Type]

	for _, field := range [...]struct {
		name string
		set  bool
	}{
		{"components", len(c.Components) != 0},
		{"style", c.Style != 0},
		{"label", c.Label != ""},
		{"url", c.URL != ""},
		{"emoji", c.Emoji != nil},
		{"disabled", c.Disabled},
		{"accessory", c.Accessory != nil},
		{"content", c.Content != ""},
		{"media", c.Media != nil},
		{"description", c.Description != ""},
		{"spoiler", c.Spoiler},
		{"items", len(c.Items) != 0},
		{"divider", c.Divider != nil},
		{"spacing", c.Spacing != 0},
		{"accent_color", c.AccentColor != nil},
	} {
		if field.set && !slices.Contains(allowed, field.name) {
			return fmt.Errorf("component type %d does not allow %q", c.Type, field.name)
		}
	}

	return nil
}

func validateComponentEmbedURL(rawURL string) error {
	if rawURL == "" {
		return fmt.Errorf("url is required")
	}
	if len(rawURL) > componentEmbedMaxURLLength {
		return fmt.Errorf("url is longer than %d characters", componentEmbedMaxURLLength)
	}

	parsed, err := url.Parse(rawURL)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return fmt.Errorf("url must be http or https")
	}

	return nil
}

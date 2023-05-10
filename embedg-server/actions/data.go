package actions

import "github.com/merlinfuchs/discordgo"

type MessageWithActions struct {
	Content         string                            `json:"content,omitempty"`
	Username        string                            `json:"username,omitempty"`
	AvatarURL       string                            `json:"avatar_url,omitempty"`
	TTS             bool                              `json:"tts,omitempty"`
	Embeds          []*discordgo.MessageEmbed         `json:"embeds,omitempty"`
	AllowedMentions *discordgo.MessageAllowedMentions `json:"allowed_mentions,omitempty"`
	Components      []ActionRowWithActions            `json:"components,omitempty"`
	Actions         map[string]ActionSet              `json:"actions,omitempty"`
}

type ActionRowWithActions struct {
	Components []ComponentWithActions
}

type ComponentWithActions struct {
	Type     discordgo.ComponentType `json:"type"`
	Disabled bool                    `json:"disabled"`

	Actions []Action

	// Button
	Style       discordgo.ButtonStyle     `json:"style"`
	Label       string                    `json:"label"`
	Emoji       *discordgo.ComponentEmoji `json:"emoji"`
	URL         string                    `json:"url"`
	ActionSetID string                    `json:"action_set_id"`

	// Select Menu
	Placeholder string                             `json:"placeholder"`
	MinValues   *int                               `json:"min_values"`
	MaxValues   int                                `json:"max_values"`
	Options     []ComponentSelectOptionWithActions `json:"options"`
}

type ComponentSelectOptionWithActions struct {
	Label       string                    `json:"label"`
	Description string                    `json:"description"`
	Emoji       *discordgo.ComponentEmoji `json:"emoji"`
	Default     bool                      `json:"default"`
	ActionSetID string                    `json:"action_set_id"`
}

type ActionType int

const (
	ActionTypeTextResponse ActionType = 1
	ActionTypeToggleRole   ActionType = 2
	ActionTypeAddRole      ActionType = 3
	ActionTypeRemoveRole   ActionType = 4
)

type Action struct {
	Type     ActionType `json:"type"`
	TargetID string     `json:"target_id"`
	Text     string     `json:"text"`
}

type ActionSet struct {
	Actions []Action `json:"actions"`
}

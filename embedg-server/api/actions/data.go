package actions

import "github.com/bwmarrin/discordgo"

type MessageWithActions struct {
	Components []ActionRowWithActions
}

type ActionRowWithActions struct {
	Components []ComponentWithActions
}

type ComponentWithActions struct {
	Type     discordgo.ComponentType `json:"type"`
	Disabled bool                    `json:"disabled"`

	Actions []Action

	// Button
	Style discordgo.ButtonStyle     `json:"style"`
	Label string                    `json:"label"`
	Emoji *discordgo.ComponentEmoji `json:"emoji"`
	URL   string                    `json:"url"`

	// Select Menu
	Placeholder string                       `json:"placeholder"`
	MinValues   *int                         `json:"min_values"`
	MaxValues   int                          `json:"max_values"`
	Options     []discordgo.SelectMenuOption `json:"options"`
}

type ActionType int

const (
	ActionTypeTextResponse ActionType = 0
	ActionTypeAddRole      ActionType = 1
	ActionTypeRemoveRole   ActionType = 2
	ActionTypeToggleRole   ActionType = 3
)

type Action struct {
	Type     ActionType `json:"type"`
	TargetID string     `json:"target_id"`
}

type ActionSet struct {
	ID      string   `json:"id"`
	Actions []Action `json:"actions"`
}

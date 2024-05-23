package actions

import (
	"slices"

	"github.com/merlinfuchs/discordgo"
)

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
	Components []ComponentWithActions `json:"components"`
}

type ComponentWithActions struct {
	Type     discordgo.ComponentType `json:"type"`
	Disabled bool                    `json:"disabled"`

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
	ActionTypeTextResponse         ActionType = 1
	ActionTypeToggleRole           ActionType = 2
	ActionTypeAddRole              ActionType = 3
	ActionTypeRemoveRole           ActionType = 4
	ActionTypeSavedMessageResponse ActionType = 5
	ActionTypeTextDM               ActionType = 6
	ActionTypeSavedMessageDM       ActionType = 7
	ActionTypeTextEdit             ActionType = 8
	ActionTypeSavedMessageEdit     ActionType = 9
	ActionTypePermissionCheck      ActionType = 10
)

type Action struct {
	Type                   ActionType `json:"type"`
	TargetID               string     `json:"target_id"`
	Text                   string     `json:"text"`
	Public                 bool       `json:"public"`
	DisableDefaultResponse bool       `json:"disable_default_response"`
	Permissions            string     `json:"permissions"`
	RoleIDs                []string   `json:"role_ids"`
	RequireAll             bool       `json:"require_all"`
}

type ActionSet struct {
	Actions []Action `json:"actions"`
}

type ActionDerivedPermissions struct {
	UserID             string   `json:"user_id"`
	GuildIsOwner       bool     `json:"guild_is_owner"`
	GuildPermissions   int64    `json:"guild_permissions"`
	ChannelPermissions int64    `json:"channel_permissions"`
	AllowedRoleIDs     []string `json:"lower_role_ids"`
}

func (a *ActionDerivedPermissions) HasChannelPermission(permission int64) bool {
	return a.GuildIsOwner || (a.GuildPermissions&discordgo.PermissionAdministrator) != 0 || (a.ChannelPermissions&permission) != 0
}

func (a *ActionDerivedPermissions) HasGuildPermission(permission int64) bool {
	return a.GuildIsOwner || (a.GuildPermissions&discordgo.PermissionAdministrator) != 0 || (a.GuildPermissions&permission) != 0
}

func (a *ActionDerivedPermissions) CanManageRole(roleID string) bool {
	if a.GuildIsOwner {
		return true
	}

	return a.HasGuildPermission(discordgo.PermissionManageRoles) && slices.Contains(a.AllowedRoleIDs, roleID)
}

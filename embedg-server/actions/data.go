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
	Components      []ComponentWithActions            `json:"components,omitempty"`
	Actions         map[string]ActionSet              `json:"actions,omitempty"`
	Flags           discordgo.MessageFlags            `json:"flags,omitempty"`
}

type ComponentWithActions struct {
	ID       int                     `json:"id,omitempty"`
	Type     discordgo.ComponentType `json:"type"`
	Disabled bool                    `json:"disabled,omitempty"`
	Spoiler  bool                    `json:"spoiler,omitempty"`

	// Action Row & Section & Container
	Components []ComponentWithActions `json:"components,omitempty"`

	// Button
	Style       discordgo.ButtonStyle     `json:"style,omitempty"`
	Label       string                    `json:"label,omitempty"`
	Emoji       *discordgo.ComponentEmoji `json:"emoji,omitempty"`
	URL         string                    `json:"url,omitempty"`
	ActionSetID string                    `json:"action_set_id,omitempty"`

	// Select Menu
	Placeholder string                             `json:"placeholder,omitempty"`
	MinValues   *int                               `json:"min_values,omitempty"`
	MaxValues   int                                `json:"max_values,omitempty"`
	Options     []ComponentSelectOptionWithActions `json:"options,omitempty"`

	// Section
	Accessory *ComponentWithActions `json:"accessory"`

	// Text Display
	Content string `json:"content,omitempty"`

	// Thumbnail
	Description string             `json:"description,omitempty"`
	Media       *UnfurledMediaItem `json:"media,omitempty"`

	// Media Gallery
	Items []ComponentMediaGalleryItem `json:"items,omitempty"`

	// File
	File *UnfurledMediaItem `json:"file,omitempty"`

	// Separator
	Divider bool `json:"divider,omitempty"`
	Spacing int  `json:"spacing,omitempty"`

	// Container
	AccentColor int `json:"accent_color,omitempty"`
}

type UnfurledMediaItem struct {
	URL string `json:"url"`
}

type ComponentSelectOptionWithActions struct {
	Label       string                    `json:"label"`
	Description string                    `json:"description"`
	Emoji       *discordgo.ComponentEmoji `json:"emoji"`
	Default     bool                      `json:"default"`
	ActionSetID string                    `json:"action_set_id"`
}

type ComponentMediaGalleryItem struct {
	Media       UnfurledMediaItem `json:"media"`
	Description string            `json:"description,omitempty"`
	Spoiler     bool              `json:"spoiler,omitempty"`
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

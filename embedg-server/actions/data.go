package actions

import (
	"encoding/json"
	"errors"
	"fmt"
	"iter"
	"reflect"
	"slices"
	"strings"
	"time"
	"unicode"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
)

type MessageWithActions struct {
	Content         string                   `json:"content,omitempty"`
	Username        string                   `json:"username,omitempty"`
	AvatarURL       string                   `json:"avatar_url,omitempty"`
	TTS             bool                     `json:"tts,omitempty"`
	Embeds          []discord.Embed          `json:"embeds,omitempty"`
	AllowedMentions *discord.AllowedMentions `json:"allowed_mentions,omitempty"`
	Components      []ComponentWithActions   `json:"components,omitempty"`
	Actions         map[string]ActionSet     `json:"actions,omitempty"`
	Flags           discord.MessageFlags     `json:"flags,omitempty"`
}

// UnmarshalJSON reads embed timestamps itself. Imported and older saved messages carry
// "timestamp": "" for an embed without one, which time.Time rejects; anything else that
// isn't a date is still an error.
func (m *MessageWithActions) UnmarshalJSON(data []byte) error {
	type message MessageWithActions
	var raw struct {
		message
		Embeds []struct {
			discord.Embed
			Timestamp string `json:"timestamp"`
		} `json:"embeds"`
	}
	if err := json.Unmarshal(data, &raw); err != nil {
		return decodeError(err)
	}

	*m = MessageWithActions(raw.message)
	m.Embeds = nil
	if raw.Embeds != nil {
		m.Embeds = make([]discord.Embed, 0, len(raw.Embeds))
	}
	for i, e := range raw.Embeds {
		embed := e.Embed
		if e.Timestamp != "" {
			t, err := time.Parse(time.RFC3339, e.Timestamp)
			if err != nil {
				return fmt.Errorf("embed %d has an invalid timestamp %q", i+1, e.Timestamp)
			}
			embed.Timestamp = &t
		}
		m.Embeds = append(m.Embeds, embed)
	}
	return nil
}

// decodeError describes a value of the wrong type by its path in the message JSON, without the Go
// type and struct names encoding/json reports, which mean nothing to whoever wrote the message.
func decodeError(err error) error {
	var typeErr *json.UnmarshalTypeError
	if !errors.As(err, &typeErr) {
		return err
	}

	var path []string
	for _, part := range strings.Split(typeErr.Field, ".") {
		// Embedded structs show up by their type name, the decoder's own wrapper as "message".
		if part == "" || part == "message" || unicode.IsUpper(rune(part[0])) {
			continue
		}
		path = append(path, part)
	}
	if len(path) == 0 {
		return fmt.Errorf("the message must be a JSON object, got %s", typeErr.Value)
	}

	var want string
	switch typeErr.Type.Kind() {
	case reflect.String:
		want = "text"
	case reflect.Bool:
		want = "true or false"
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64,
		reflect.Float32, reflect.Float64:
		want = "a number"
	case reflect.Slice, reflect.Array:
		want = "a list"
	default:
		want = "an object"
	}
	return fmt.Errorf("%s must be %s, got %s", strings.Join(path, "."), want, typeErr.Value)
}

func (m MessageWithActions) ComponentsV2Enabled() bool {
	return m.Flags&(1<<15) != 0
}

type ComponentWithActions struct {
	ID       int                   `json:"id,omitempty"`
	Type     discord.ComponentType `json:"type"`
	Disabled bool                  `json:"disabled,omitempty"`
	Spoiler  bool                  `json:"spoiler,omitempty"`

	// Action Row & Section & Container
	Components []ComponentWithActions `json:"components,omitempty"`

	// Button
	Style       discord.ButtonStyle     `json:"style,omitempty"`
	Label       string                  `json:"label,omitempty"`
	Emoji       *discord.ComponentEmoji `json:"emoji,omitempty"`
	URL         string                  `json:"url,omitempty"`
	ActionSetID string                  `json:"action_set_id,omitempty"`

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
	Divider *bool `json:"divider,omitempty"`
	Spacing int   `json:"spacing,omitempty"`

	// Container
	AccentColor int `json:"accent_color,omitempty"`
}

type UnfurledMediaItem struct {
	URL string `json:"url"`
}

type ComponentSelectOptionWithActions struct {
	Label       string                  `json:"label"`
	Description string                  `json:"description"`
	Emoji       *discord.ComponentEmoji `json:"emoji"`
	Default     bool                    `json:"default"`
	ActionSetID string                  `json:"action_set_id"`
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
	ActionTypeTextChannel          ActionType = 11
	ActionTypeSavedMessageChannel  ActionType = 12
)

type Action struct {
	Type                   ActionType `json:"type"`
	TargetID               string     `json:"target_id"`
	ChannelID              string     `json:"channel_id"`
	Text                   string     `json:"text"`
	Public                 bool       `json:"public"`
	AllowRoleMentions      bool       `json:"allow_role_mentions"`
	DisableDefaultResponse bool       `json:"disable_default_response"`
	Permissions            string     `json:"permissions"`
	RoleIDs                []string   `json:"role_ids"`
}

type ActionSet struct {
	Actions []Action `json:"actions"`
}

type ActionDerivedPermissions struct {
	UserID             common.ID   `json:"user_id"`
	GuildIsOwner       bool        `json:"guild_is_owner"`
	GuildPermissions   uint64      `json:"guild_permissions"`
	ChannelPermissions uint64      `json:"channel_permissions"`
	AllowedRoleIDs     []common.ID `json:"lower_role_ids"`
	// AllowedChannelIDs is only filled when the actions can send to another channel, and never for
	// owners and administrators, who may send everywhere.
	AllowedChannelIDs []common.ID `json:"allowed_channel_ids,omitempty"`
}

func (a *ActionDerivedPermissions) HasChannelPermission(permission discord.Permissions) bool {
	perms := discord.Permissions(a.ChannelPermissions)
	return a.GuildIsOwner || perms.Has(discord.PermissionAdministrator) || perms.Has(permission)
}

func (a *ActionDerivedPermissions) HasGuildPermission(permission discord.Permissions) bool {
	perms := discord.Permissions(a.GuildPermissions)
	return a.GuildIsOwner || perms.Has(discord.PermissionAdministrator) || perms.Has(permission)
}

func (a *ActionDerivedPermissions) CanManageRole(roleID common.ID) bool {
	if a.GuildIsOwner {
		return true
	}

	return a.HasGuildPermission(discord.PermissionManageRoles) && slices.Contains(a.AllowedRoleIDs, roleID)
}

// MayTargetChannels reports whether the action sets can send a message to another channel, directly or
// through the actions of a saved message they send, which aren't known before it's sent.
func MayTargetChannels(actionSets iter.Seq[ActionSet]) bool {
	for set := range actionSets {
		for _, action := range set.Actions {
			switch action.Type {
			case ActionTypeTextChannel, ActionTypeSavedMessageChannel,
				ActionTypeSavedMessageResponse, ActionTypeSavedMessageDM, ActionTypeSavedMessageEdit:
				return true
			}
		}
	}
	return false
}

// CanSendToChannel reports whether the creator could have sent a message to the channel from the
// dashboard. For a thread the caller passes its parent.
func (a *ActionDerivedPermissions) CanSendToChannel(channelID common.ID) bool {
	return a.HasGuildPermission(discord.PermissionAdministrator) || slices.Contains(a.AllowedChannelIDs, channelID)
}

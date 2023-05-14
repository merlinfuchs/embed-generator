package wire

import (
	"time"

	"gopkg.in/guregu/null.v4"
)

type GuildWire struct {
	ID   string      `json:"id"`
	Name string      `json:"name"`
	Icon null.String `json:"icon"`

	HasPremium               bool `json:"is_premium"`
	HasChannelWithUserAccess bool `json:"has_channel_with_user_access"`
	HasChannelWithBotAccess  bool `json:"has_channel_with_bot_access"`
}

type ListGuildsResponseWire APIResponse[[]GuildWire]

type GetGuildResponseWire APIResponse[GuildWire]

type GuildChannelWire struct {
	ID       string      `json:"id"`
	Name     string      `json:"name"`
	Position int         `json:"position"`
	ParentID null.String `json:"parent_id"`
	Type     int         `json:"type"`

	UserAccess      bool   `json:"user_access"`
	UserPermissions string `json:"user_permissions"`
	BotAccess       bool   `json:"bot_access"`
	BotPermissions  string `json:"bot_permissions"`
}

type ListChannelsResponseWire APIResponse[[]GuildChannelWire]

type GuildRoleWire struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Managed  bool   `json:"managed"`
	Color    int    `json:"color"`
	Position int    `json:"position"`
}

type ListRolesResponseWire APIResponse[[]GuildRoleWire]

type GuildEmojiWire struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Available bool   `json:"available"`
	Animated  bool   `json:"animated"`
	Managed   bool   `json:"managed"`
}

type ListEmojisResponseWire APIResponse[[]GuildEmojiWire]

type GuildStickerWire struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Available   bool   `json:"available"`
	FormantType int    `json:"formant_type"`
}

type ListStickersResponseWire APIResponse[[]GuildStickerWire]

type GuildSubscriptionWire struct {
	UpdatedAt time.Time `json:"updated_at"`
	Plan      string    `json:"plan"`
	Status    string    `json:"status"`
}

type ListGuildSubscriptionsResponseWire APIResponse[[]GuildSubscriptionWire]

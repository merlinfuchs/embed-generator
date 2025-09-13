package wire

import (
	"gopkg.in/guregu/null.v4"
)

type GuildWire struct {
	ID   string      `json:"id"`
	Name string      `json:"name"`
	Icon null.String `json:"icon"`
}

type ListGuildsResponseWire APIResponse[[]GuildWire]

type GetGuildResponseWire APIResponse[GuildWire]

type GuildChannelWire struct {
	ID       string      `json:"id"`
	Name     string      `json:"name"`
	Position int         `json:"position"`
	ParentID null.String `json:"parent_id"`
	Type     int         `json:"type"`
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

type GuildBrandingWire struct {
	DefaultUsername  null.String `json:"default_username"`
	DefaultAvatarURL null.String `json:"default_avatar_url"`
}

type GetGuildBrandingResponseWire APIResponse[GuildBrandingWire]

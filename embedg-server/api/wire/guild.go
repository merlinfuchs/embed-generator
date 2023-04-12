package wire

import "gopkg.in/guregu/null.v4"

type GuildWire struct {
	ID   string      `json:"id"`
	Name string      `json:"name"`
	Icon null.String `json:"icon"`

	BotSendPermissions  bool `json:"bot_send_permissions"`  // also true when the bot has send permissions in at least one channel
	UserSendPermissions bool `json:"user_send_permissions"` // also true when the user has send permissions in at least one channel
}

type GuildChannelWire struct {
	ID       string      `json:"id"`
	Name     string      `json:"name"`
	Position int         `json:"position"`
	ParentID null.String `json:"parent_id"`
	Type     int         `json:"type"`

	BotSendPermissions  bool `json:"bot_send_permissions"`
	UserSendPermissions bool `json:"user_send_permissions"`
}

type GuildRoleWire struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Managed bool   `json:"managed"`
}

type GuildEmojiWire struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Available bool   `json:"available"`
	Animated  bool   `json:"animated"`
	Managed   bool   `json:"managed"`
}

type GuildStickerWire struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Available   bool   `json:"available"`
	FormantType int    `json:"formant_type"`
}

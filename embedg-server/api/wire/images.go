package wire

import "gopkg.in/guregu/null.v4"

type ImageWire struct {
	ID       string      `json:"id"`
	UserID   string      `json:"user_id"`
	GuildID  null.String `json:"guild_id"`
	FileName string      `json:"file_name"`
	FileSize int32       `json:"file_size"`
	CDNKey   string      `json:"cdn_key"`
}

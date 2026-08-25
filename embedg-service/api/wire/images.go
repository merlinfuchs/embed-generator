package wire

import "github.com/merlinfuchs/embed-generator/embedg-service/common"

type ImageWire struct {
	ID       string        `json:"id"`
	UserID   common.ID     `json:"user_id"`
	GuildID  common.NullID `json:"guild_id"`
	FileName string        `json:"file_name"`
	FileSize int           `json:"file_size"`
	CDNURL   string        `json:"cdn_url"`
}

type UploadImageResponseWire APIResponse[ImageWire]

type GetImageResponseWire APIResponse[ImageWire]

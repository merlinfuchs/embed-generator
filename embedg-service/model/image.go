package model

import "github.com/merlinfuchs/embed-generator/embedg-service/common"

type Image struct {
	ID              string
	UserID          common.ID
	GuildID         common.NullID
	FileHash        string
	FileName        string
	FileSize        int
	FileContentType string
	S3Key           string
}

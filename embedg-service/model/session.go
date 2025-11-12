package model

import (
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
)

type Session struct {
	TokenHash   string
	UserID      common.ID
	GuildIds    []common.ID
	AccessToken string
	CreatedAt   time.Time
	ExpiresAt   time.Time
}

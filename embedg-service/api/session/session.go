package session

import (
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
)

type Session struct {
	UserID      common.ID
	GuildIDs    []common.ID
	AccessToken string
	CreatedAt   time.Time
	ExpiresAt   time.Time
}

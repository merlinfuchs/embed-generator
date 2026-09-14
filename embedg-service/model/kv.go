package model

import (
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"gopkg.in/guregu/null.v4"
)

type KVEntry struct {
	Key       string
	GuildID   common.ID
	Value     string
	ExpiresAt null.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

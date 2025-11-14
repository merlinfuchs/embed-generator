package model

import (
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"gopkg.in/guregu/null.v4"
)

type Entitlement struct {
	ID              string
	UserID          common.NullID
	GuildID         common.NullID
	UpdatedAt       time.Time
	Deleted         bool
	SkuID           common.ID
	StartsAt        null.Time
	EndsAt          null.Time
	Consumed        bool
	ConsumedGuildID common.NullID
}

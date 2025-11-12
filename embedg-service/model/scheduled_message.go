package model

import (
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"gopkg.in/guregu/null.v4"
)

type ScheduledMessage struct {
	ID             string
	CreatorID      common.ID
	GuildID        common.ID
	ChannelID      common.ID
	MessageID      common.NullID
	SavedMessageID string
	Name           string
	Description    null.String
	CronExpression null.String
	OnlyOnce       bool
	StartAt        time.Time
	EndAt          null.Time
	NextAt         time.Time
	Enabled        bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
	CronTimezone   null.String
	ThreadName     null.String
}

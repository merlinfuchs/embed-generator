package model

import (
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"gopkg.in/guregu/null.v4"
)

type ScheduledMessage struct {
	ID        string
	CreatorID common.ID
	GuildID   common.ID
	ChannelID common.ID
	MessageID common.NullID
	// MessageWebhookID is the webhook that sent MessageID, invalid when the custom bot sent it.
	MessageWebhookID common.NullID
	SavedMessageID   string
	Name             string
	Description      null.String
	CronExpression   null.String
	OnlyOnce         bool
	StartAt          time.Time
	EndAt            null.Time
	NextAt           time.Time
	Enabled          bool
	CreatedAt        time.Time
	UpdatedAt        time.Time
	CronTimezone     null.String
	ThreadName       null.String
	LastSentAt       null.Time
	// LastError explains to the user why the last run failed or why the message was stopped.
	LastError   null.String
	LastErrorAt null.Time
}

// ScheduledMessageRun is what running a scheduled message changes about it. LastSentAt is left
// as it is when invalid.
type ScheduledMessageRun struct {
	NextAt      time.Time
	Enabled     bool
	LastSentAt  null.Time
	LastError   null.String
	LastErrorAt null.Time
	UpdatedAt   time.Time
}

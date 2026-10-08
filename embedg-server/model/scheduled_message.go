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
	StartAt          time.Time
	EndAt            null.Time
	NextAt           time.Time
	Enabled          bool
	CreatedAt        time.Time
	UpdatedAt        time.Time
	// RunTimes are the dates of a message sent on specific dates, sorted. Nil when it repeats
	// on CronExpression instead.
	RunTimes     []time.Time
	CronTimezone null.String
	// CronInterval runs the cron expression only in every Nth period, see scheduled_messages.Schedule.
	CronInterval int
	ThreadName   null.String
	LastSentAt   null.Time
	// LastError explains to the user why the last run failed or why the message was stopped.
	LastError   null.String
	LastErrorAt null.Time
}

// OnDates is whether the message is sent on a list of dates instead of repeating.
func (m ScheduledMessage) OnDates() bool {
	return len(m.RunTimes) > 0
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

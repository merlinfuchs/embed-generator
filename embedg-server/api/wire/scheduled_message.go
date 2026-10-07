package wire

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"gopkg.in/guregu/null.v4"
)

type ScheduledMessageWire struct {
	ID             string        `json:"id"`
	CreatorID      common.ID     `json:"creator_id"`
	GuildID        common.ID     `json:"guild_id"`
	ChannelID      common.ID     `json:"channel_id"`
	MessageID      common.NullID `json:"message_id"`
	ThreadName     null.String   `json:"thread_name"`
	SavedMessageID string        `json:"saved_message_id"`
	Name           string        `json:"name"`
	Description    null.String   `json:"description"`
	CronExpression null.String   `json:"cron_expression"`
	CronTimezone   null.String   `json:"cron_timezone"`
	CronInterval   int           `json:"cron_interval"`
	StartAt        time.Time     `json:"start_at"`
	EndAt          null.Time     `json:"end_at"`
	NextAt         time.Time     `json:"next_at"`
	OnlyOnce       bool          `json:"only_once"`
	Enabled        bool          `json:"enabled"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
	LastSentAt     null.Time     `json:"last_sent_at"`
	// LastError is why the last run failed, or why the message was stopped when it's disabled.
	LastError   null.String `json:"last_error"`
	LastErrorAt null.Time   `json:"last_error_at"`
}

type ScheduledMessageListResponseWire APIResponse[[]ScheduledMessageWire]

type ScheduledMessageGetResponseWire APIResponse[ScheduledMessageWire]

// ScheduledMessageScheduleWire is when a scheduled message is sent.
type ScheduledMessageScheduleWire struct {
	CronExpression null.String `json:"cron_expression"`
	CronTimezone   null.String `json:"cron_timezone"`
	// CronInterval runs the cron expression only in every Nth day, week, month or hour, counted
	// from its first run. 0 or left out means every one. Ignored for messages sent only once.
	CronInterval int       `json:"cron_interval"`
	StartAt      time.Time `json:"start_at"`
	EndAt        null.Time `json:"end_at"`
	OnlyOnce     bool      `json:"only_once"`
}

func (s ScheduledMessageScheduleWire) Validate() error {
	return validation.ValidateStruct(&s,
		validation.Field(&s.CronExpression, validation.When(
			!s.OnlyOnce,
			validation.Required,
		)),
		validation.Field(&s.CronInterval, validation.When(
			!s.OnlyOnce,
			validation.Min(0),
			validation.Max(maxCronInterval),
		)),
		validation.Field(&s.StartAt, validation.Required),
		validation.Field(&s.CronTimezone, validation.By(validateTimezone)),
	)
}

type ScheduledMessageCreateRequestWire struct {
	ChannelID                    common.ID     `json:"channel_id"`
	MessageID                    common.NullID `json:"message_id"`
	ThreadName                   null.String   `json:"thread_name"`
	SavedMessageID               string        `json:"saved_message_id"`
	Name                         string        `json:"name"`
	Description                  null.String   `json:"description"`
	ScheduledMessageScheduleWire `tstype:",extends"`
	Enabled                      bool `json:"enabled"`
}

func (req ScheduledMessageCreateRequestWire) Validate() error {
	if err := req.ScheduledMessageScheduleWire.Validate(); err != nil {
		return err
	}
	return validation.ValidateStruct(&req,
		validation.Field(&req.ChannelID, validation.Required),
		validation.Field(&req.SavedMessageID, validation.Required),
		// Editing a message can't create a thread.
		validation.Field(&req.ThreadName, validation.When(req.MessageID.Valid, validation.Empty)),
		validation.Field(&req.Name, validation.Required, validation.Length(1, 32)),
	)
}

type ScheduledMessageCreateResponseWire APIResponse[ScheduledMessageWire]

type ScheduledMessageUpdateRequestWire ScheduledMessageCreateRequestWire

func (req ScheduledMessageUpdateRequestWire) Validate() error {
	return ScheduledMessageCreateRequestWire(req).Validate()
}

type ScheduledMessageUpdateResponseWire APIResponse[ScheduledMessageWire]

type ScheduledMessageDeleteResponseWire APIResponse[struct{}]

type ScheduledMessagePreviewWire struct {
	// Runs are the next sends, none past end_at.
	Runs []time.Time `json:"runs"`
	// More is whether more sends follow the listed ones.
	More bool `json:"more"`
}

type ScheduledMessagePreviewResponseWire APIResponse[ScheduledMessagePreviewWire]

const maxCronInterval = 1000

func validateTimezone(v any) error {
	_, err := common.LoadTimezone(v.(null.String).String)
	return err
}

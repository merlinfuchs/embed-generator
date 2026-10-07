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
	RunTimes       []time.Time   `json:"run_times"`
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

// ScheduledMessageScheduleWire is when a scheduled message is sent: on the dates in run_times, or
// repeating on cron_expression.
type ScheduledMessageScheduleWire struct {
	// RunTimes are the dates to send on, one for a message sent once.
	RunTimes       []time.Time `json:"run_times"`
	CronExpression null.String `json:"cron_expression"`
	CronTimezone   null.String `json:"cron_timezone"`
	// CronInterval runs the cron expression only in every Nth day, week, month or hour, counted
	// from its first run. 0 or left out means every one.
	CronInterval int `json:"cron_interval"`
	// StartAt is where a repeating schedule starts, the first date for one on dates.
	StartAt time.Time `json:"start_at"`
	EndAt   null.Time `json:"end_at"`
	// EndAfterRuns ends the schedule after this many sends from its next one, instead of at end_at.
	EndAfterRuns int `json:"end_after_runs"`
}

// SendsOnce is whether it's sent on a single date, all free plans can do.
func (s ScheduledMessageScheduleWire) SendsOnce() bool {
	return len(s.RunTimes) == 1
}

// OnDates is whether it's sent on a list of dates instead of repeating.
func (s ScheduledMessageScheduleWire) OnDates() bool {
	return len(s.RunTimes) > 0
}

func (s ScheduledMessageScheduleWire) Validate() error {
	onDates := s.OnDates()
	return validation.ValidateStruct(&s,
		validation.Field(&s.RunTimes, validation.Length(0, MaxRunTimes)),
		validation.Field(&s.CronExpression,
			validation.When(!onDates, validation.Required),
			validation.When(onDates, validation.Empty),
		),
		validation.Field(&s.CronInterval, validation.Min(0), validation.Max(maxCronInterval)),
		validation.Field(&s.StartAt, validation.When(!onDates, validation.Required)),
		validation.Field(&s.EndAt, validation.When(onDates || s.EndAfterRuns > 0, validation.Empty)),
		validation.Field(&s.EndAfterRuns,
			validation.Min(0),
			validation.Max(maxEndAfterRuns),
			validation.When(onDates, validation.Empty),
		),
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
	// EndAt is when the schedule ends, also when it ends after a number of sends.
	EndAt null.Time `json:"end_at"`
}

type ScheduledMessagePreviewResponseWire APIResponse[ScheduledMessagePreviewWire]

const maxCronInterval = 1000

// MaxRunTimes is how many dates a scheduled message can be sent on.
const MaxRunTimes = 100

const maxEndAfterRuns = 1000

func validateTimezone(v any) error {
	_, err := common.LoadTimezone(v.(null.String).String)
	return err
}

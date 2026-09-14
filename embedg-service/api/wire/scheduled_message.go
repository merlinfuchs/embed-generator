package wire

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
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
	StartAt        time.Time     `json:"start_at"`
	EndAt          null.Time     `json:"end_at"`
	NextAt         time.Time     `json:"next_at"`
	OnlyOnce       bool          `json:"only_once"`
	Enabled        bool          `json:"enabled"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
}

type ScheduledMessageListResponseWire APIResponse[[]ScheduledMessageWire]

type ScheduledMessageGetResponseWire APIResponse[ScheduledMessageWire]

type ScheduledMessageCreateRequestWire struct {
	ChannelID      common.ID     `json:"channel_id"`
	MessageID      common.NullID `json:"message_id"`
	ThreadName     null.String   `json:"thread_name"`
	SavedMessageID string        `json:"saved_message_id"`
	Name           string        `json:"name"`
	Description    null.String   `json:"description"`
	CronExpression null.String   `json:"cron_expression"`
	CronTimezone   null.String   `json:"cron_timezone"`
	StartAt        time.Time     `json:"start_at"`
	EndAt          null.Time     `json:"end_at"`
	OnlyOnce       bool          `json:"only_once"`
	Enabled        bool          `json:"enabled"`
}

func (req ScheduledMessageCreateRequestWire) Validate() error {
	return validation.ValidateStruct(&req,
		validation.Field(&req.ChannelID, validation.Required),
		validation.Field(&req.SavedMessageID, validation.Required),
		validation.Field(&req.Name, validation.Required, validation.Length(1, 32)),
		validation.Field(&req.CronExpression, validation.When(
			!req.OnlyOnce,
			validation.Required,
		)),
		validation.Field(&req.StartAt, validation.Required),
	)
}

type ScheduledMessageCreateResponseWire APIResponse[ScheduledMessageWire]

type ScheduledMessageUpdateRequestWire struct {
	ChannelID      common.ID     `json:"channel_id"`
	MessageID      common.NullID `json:"message_id"`
	ThreadName     null.String   `json:"thread_name"`
	SavedMessageID string        `json:"saved_message_id"`
	Name           string        `json:"name"`
	Description    null.String   `json:"description"`
	CronExpression null.String   `json:"cron_expression"`
	CronTimezone   null.String   `json:"cron_timezone"`
	StartAt        time.Time     `json:"start_at"`
	EndAt          null.Time     `json:"end_at"`
	OnlyOnce       bool          `json:"only_once"`
	Enabled        bool          `json:"enabled"`
}

func (req ScheduledMessageUpdateRequestWire) Validate() error {
	return validation.ValidateStruct(&req,
		validation.Field(&req.ChannelID, validation.Required),
		validation.Field(&req.SavedMessageID, validation.Required),
		validation.Field(&req.Name, validation.Required, validation.Length(1, 32)),
		validation.Field(&req.CronExpression, validation.When(
			!req.OnlyOnce,
			validation.Required,
		)),
		validation.Field(&req.StartAt, validation.Required),
	)
}

type ScheduledMessageUpdateResponseWire APIResponse[ScheduledMessageWire]

type ScheduledMessageDeleteResponseWire APIResponse[struct{}]

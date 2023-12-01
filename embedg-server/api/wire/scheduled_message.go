package wire

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation/v4"
	"gopkg.in/guregu/null.v4"
)

type ScheduledMessageWire struct {
	ID             string      `json:"id"`
	CreatorID      string      `json:"creator_id"`
	GuildID        string      `json:"guild_id"`
	ChannelID      string      `json:"channel_id"`
	MessageID      null.String `json:"message_id"`
	SavedMessageID string      `json:"saved_message_id"`
	CronExpression null.String `json:"cron_expression"`
	TriggerAt      time.Time   `json:"trigger_at"`
	TriggerOnce    bool        `json:"trigger_once"`
	Enabled        bool        `json:"enabled"`
	CreatedAt      time.Time   `json:"created_at"`
	UpdatedAt      time.Time   `json:"updated_at"`
}

type ScheduledMessageListResponseWire APIResponse[[]ScheduledMessageWire]

type ScheduledMessageGetResponseWire APIResponse[ScheduledMessageWire]

type ScheduledMessageCreateRequestWire struct {
	ChannelID      string      `json:"channel_id"`
	MessageID      null.String `json:"message_id"`
	SavedMessageID string      `json:"saved_message_id"`
	CronExpression null.String `json:"cron_expression"`
	TriggerAt      time.Time   `json:"trigger_at"`
	TriggerOnce    bool        `json:"trigger_once"`
	Enabled        bool        `json:"enabled"`
}

func (req ScheduledMessageCreateRequestWire) Validate() error {
	return validation.ValidateStruct(&req,
		validation.Field(&req.ChannelID, validation.Required),
		validation.Field(&req.SavedMessageID, validation.Required),
		validation.Field(&req.CronExpression, validation.When(
			!req.TriggerOnce,
			validation.Required,
		)),
		validation.Field(&req.TriggerAt, validation.Required),
	)
}

type ScheduledMessageCreateResponseWire APIResponse[ScheduledMessageWire]

type ScheduledMessageUpdateRequestWire struct {
	ChannelID      string      `json:"channel_id"`
	MessageID      null.String `json:"message_id"`
	SavedMessageID string      `json:"saved_message_id"`
	CronExpression null.String `json:"cron_expression"`
	TriggerAt      time.Time   `json:"trigger_at"`
	TriggerOnce    bool        `json:"trigger_once"`
	Enabled        bool        `json:"enabled"`
}

func (req ScheduledMessageUpdateRequestWire) Validate() error {
	return validation.ValidateStruct(&req,
		validation.Field(&req.ChannelID, validation.Required),
		validation.Field(&req.SavedMessageID, validation.Required),
		validation.Field(&req.CronExpression, validation.When(
			!req.TriggerOnce,
			validation.Required,
		)),
		validation.Field(&req.TriggerAt, validation.Required),
	)
}

type ScheduledMessageUpdateResponseWire APIResponse[ScheduledMessageWire]

type ScheduledMessageDeleteResponseWire APIResponse[struct{}]

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
	Name           string      `json:"name"`
	Description    null.String `json:"description"`
	CronExpression null.String `json:"cron_expression"`
	StartAt        time.Time   `json:"trigger_at"`
	EndAt          null.Time   `json:"end_at"`
	NextAt         time.Time   `json:"next_at"`
	OnlyOnce       bool        `json:"trigger_once"`
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
	Name           string      `json:"name"`
	Description    null.String `json:"description"`
	CronExpression null.String `json:"cron_expression"`
	StartAt        time.Time   `json:"start_at"`
	EndAt          null.Time   `json:"end_at"`
	OnlyOnce       bool        `json:"trigger_once"`
	Enabled        bool        `json:"enabled"`
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
	ChannelID      string      `json:"channel_id"`
	MessageID      null.String `json:"message_id"`
	SavedMessageID string      `json:"saved_message_id"`
	Name           string      `json:"name"`
	Description    null.String `json:"description"`
	CronExpression null.String `json:"cron_expression"`
	StartAt        time.Time   `json:"trigger_at"`
	EndAt          null.Time   `json:"end_at"`
	OnlyOnce       bool        `json:"trigger_once"`
	Enabled        bool        `json:"enabled"`
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

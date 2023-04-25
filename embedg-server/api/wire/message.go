package wire

import (
	"encoding/json"
	"time"

	"gopkg.in/guregu/null.v4"
)

type SavedMessageWire struct {
	ID          string          `json:"id"`
	CreatorID   string          `json:"owner_id"`
	GuildID     null.String     `json:"guild_id"`
	UpdatedAt   time.Time       `json:"updated_at"`
	Name        string          `json:"name"`
	Description null.String     `json:"description"`
	Data        json.RawMessage `json:"data"`
}

type SavedMessageListResponseWire []SavedMessageWire

type SavedMessageGetResponseWire SavedMessageWire

type SavedMessageCreateRequestWire struct {
	Name        string          `json:"name"`
	Description null.String     `json:"description"`
	Data        json.RawMessage `json:"data"`
}

func (req SavedMessageCreateRequestWire) Validate() error {
	return nil
}

type SavedMessageCreateResponseWire SavedMessageWire

type SavedMessageUpdateRequestWire struct {
	Name        string          `json:"name"`
	Description null.String     `json:"description"`
	Data        json.RawMessage `json:"data"`
}

func (req SavedMessageUpdateRequestWire) Validate() error {
	return nil
}

type SavedMessageUpdateResponseWire SavedMessageWire

type SavedMessageDeleteResponseWire struct{}

type MessageSendToWebhookRequestWire struct {
	WebhookID    string                             `json:"webhook_id"`
	WebhookToken string                             `json:"webhook_token"`
	ThreadID     null.String                        `json:"thread_id"`
	MessageID    null.String                        `json:"message_id"`
	Data         json.RawMessage                    `json:"data"`
	Attachments  []MessageSendRequestAttachmentWire `json:"attachments"`
}

func (req MessageSendToWebhookRequestWire) Validate() error {
	return nil
}

type MessageSendToChannelRequestWire struct {
	GuildID     string                             `json:"guild_id"`
	ChannelID   string                             `json:"channel_id"`
	MessageID   null.String                        `json:"message_id"`
	Data        json.RawMessage                    `json:"data"`
	Attachments []MessageSendRequestAttachmentWire `json:"attachments"`
}

func (req MessageSendToChannelRequestWire) Validate() error {
	return nil
}

type MessageSendRequestAttachmentWire struct {
	Name        string      `json:"name"`
	Description null.String `json:"description"`
	DataURL     string      `json:"data_url"`
}

type MessageSendResponseWire struct {
	MessageID string `json:"message_id"`
}

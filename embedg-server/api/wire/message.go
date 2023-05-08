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

type SavedMessageListResponseWire APIResponse[[]SavedMessageWire]

type SavedMessageGetResponseWire APIResponse[SavedMessageWire]

type SavedMessageCreateRequestWire struct {
	Name        string          `json:"name"`
	Description null.String     `json:"description"`
	Data        json.RawMessage `json:"data"`
}

func (req SavedMessageCreateRequestWire) Validate() error {
	return nil
}

type SavedMessageCreateResponseWire APIResponse[SavedMessageWire]

type SavedMessageUpdateRequestWire struct {
	Name        string          `json:"name"`
	Description null.String     `json:"description"`
	Data        json.RawMessage `json:"data"`
}

func (req SavedMessageUpdateRequestWire) Validate() error {
	return nil
}

type SavedMessageUpdateResponseWire APIResponse[SavedMessageWire]

type SavedMessageDeleteResponseWire APIResponse[struct{}]

type SavedMessagesImportResponseWire APIResponse[[]SavedMessageWire]

type SavedMessagesImportRequestWire struct {
	Messages []SavedMessageImportDataWire `json:"messages"`
}

type SavedMessageImportDataWire struct {
	Name        string          `json:"name"`
	Description null.String     `json:"description"`
	Data        json.RawMessage `json:"data"`
}

func (req SavedMessagesImportRequestWire) Validate() error {
	return nil
}

type MessageSendToWebhookRequestWire struct {
	WebhookID    string                   `json:"webhook_id"`
	WebhookToken string                   `json:"webhook_token"`
	ThreadID     null.String              `json:"thread_id"`
	MessageID    null.String              `json:"message_id"`
	Data         json.RawMessage          `json:"data"`
	Attachments  []*MessageAttachmentWire `json:"attachments"`
}

func (req MessageSendToWebhookRequestWire) Validate() error {
	return nil
}

type MessageSendToChannelRequestWire struct {
	GuildID     string                   `json:"guild_id"`
	ChannelID   string                   `json:"channel_id"`
	MessageID   null.String              `json:"message_id"`
	Data        json.RawMessage          `json:"data"`
	Attachments []*MessageAttachmentWire `json:"attachments"`
}

func (req MessageSendToChannelRequestWire) Validate() error {
	return nil
}

type MessageAttachmentWire struct {
	Name        string      `json:"name"`
	Description null.String `json:"description"`
	DataURL     string      `json:"data_url"`
	Size        int         `json:"size"`
}

type MessageSendResponseDataWire struct {
	MessageID string `json:"message_id"`
}

type MessageSendResponseWire APIResponse[MessageSendResponseDataWire]

type MessageRestoreFromWebhookRequestWire struct {
	WebhookID    string      `json:"webhook_id"`
	WebhookToken string      `json:"webhook_token"`
	ThreadID     null.String `json:"thread_id"`
	MessageID    string      `json:"message_id"`
}

func (req MessageRestoreFromWebhookRequestWire) Validate() error {
	return nil
}

type MessageRestoreFromChannelRequestWire struct {
	GuildID   string `json:"guild_id"`
	ChannelID string `json:"channel_id"`
	MessageID string `json:"message_id"`
}

func (req MessageRestoreFromChannelRequestWire) Validate() error {
	return nil
}

type MessageRestoreResponseDataWire struct {
	Data        json.RawMessage          `json:"data"`
	Attachments []*MessageAttachmentWire `json:"attachments"`
}

type MessageRestoreResponseWire APIResponse[MessageRestoreResponseDataWire]

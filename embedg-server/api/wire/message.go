package wire

import (
	"encoding/json"
	"regexp"
	"time"

	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"gopkg.in/guregu/null.v4"
)

type SavedMessageWire struct {
	ID          string          `json:"id"`
	CreatorID   common.ID       `json:"owner_id"`
	GuildID     common.NullID   `json:"guild_id"`
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
	Name        string      `json:"name"`
	Description null.String `json:"description"`
	// Data is left as it is when omitted, so a rename can't undo a newer overwrite.
	Data json.RawMessage `json:"data,omitempty"`
}

func (req SavedMessageUpdateRequestWire) Validate() error {
	return nil
}

type SavedMessageUpdateResponseWire APIResponse[SavedMessageWire]

type SavedMessageDeleteResponseWire APIResponse[struct{}]

// SavedMessageVersionWire is what a saved message looked like before it was overwritten.
type SavedMessageVersionWire struct {
	ID string `json:"id"`
	// CreatedAt is when the version was saved, not when it was overwritten.
	CreatedAt time.Time `json:"created_at"`
	Name      string    `json:"name"`
}

type SavedMessageVersionListResponseWire APIResponse[[]SavedMessageVersionWire]

type SavedMessageVersionDataWire struct {
	SavedMessageVersionWire `tstype:",extends"`
	Data                    json.RawMessage `json:"data"`
}

type SavedMessageVersionGetResponseWire APIResponse[SavedMessageVersionDataWire]

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

// WebhookPlatform is where a webhook lives. Fluxer's webhooks take Discord's message format, minus
// the components and threads.
type WebhookPlatform string

const (
	WebhookPlatformDiscord WebhookPlatform = "discord"
	WebhookPlatformFluxer  WebhookPlatform = "fluxer"
)

// The token ends up in the request path, so anything but the characters Discord and Fluxer use
// could point the request somewhere else.
var webhookTokenRegex = regexp.MustCompile(`^[A-Za-z0-9_-]+$`)

var snowflakeRegex = regexp.MustCompile(`^[0-9]+$`)

func validateWebhookTarget(platform *WebhookPlatform, token *string) []*validation.FieldRules {
	return []*validation.FieldRules{
		// Empty from tabs opened before Fluxer was supported, which only sent to Discord.
		validation.Field(platform, validation.In(WebhookPlatformDiscord, WebhookPlatformFluxer)),
		validation.Field(token, validation.Required, validation.Match(webhookTokenRegex)),
	}
}

type MessageSendToWebhookRequestWire struct {
	WebhookPlatform WebhookPlatform          `json:"webhook_platform"`
	WebhookID       string                   `json:"webhook_id"`
	WebhookToken    string                   `json:"webhook_token"`
	ThreadID        common.NullID            `json:"thread_id"`
	MessageID       common.NullID            `json:"message_id"`
	Data            json.RawMessage          `json:"data"`
	Attachments     []*MessageAttachmentWire `json:"attachments"`
}

func (req MessageSendToWebhookRequestWire) Validate() error {
	return validation.ValidateStruct(&req, append(
		validateWebhookTarget(&req.WebhookPlatform, &req.WebhookToken),
		validation.Field(&req.WebhookID, validation.Required, validation.Match(snowflakeRegex)),
	)...)
}

type MessageSendToChannelRequestWire struct {
	GuildID     common.ID                `json:"guild_id"`
	ChannelID   common.ID                `json:"channel_id"`
	ThreadName  null.String              `json:"thread_name"`
	MessageID   common.NullID            `json:"message_id"`
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
	MessageID common.ID `json:"message_id"`
	ChannelID common.ID `json:"channel_id"`
}

type MessageSendResponseWire APIResponse[MessageSendResponseDataWire]

type MessageRestoreFromWebhookRequestWire struct {
	WebhookPlatform WebhookPlatform `json:"webhook_platform"`
	WebhookID       common.ID       `json:"webhook_id"`
	WebhookToken    string          `json:"webhook_token"`
	ThreadID        null.String     `json:"thread_id"`
	MessageID       common.ID       `json:"message_id"`
}

func (req MessageRestoreFromWebhookRequestWire) Validate() error {
	return validation.ValidateStruct(&req, validateWebhookTarget(&req.WebhookPlatform, &req.WebhookToken)...)
}

type MessageRestoreFromChannelRequestWire struct {
	GuildID   common.ID `json:"guild_id"`
	ChannelID common.ID `json:"channel_id"`
	MessageID common.ID `json:"message_id"`
}

func (req MessageRestoreFromChannelRequestWire) Validate() error {
	return nil
}

type MessageRestoreResponseDataWire struct {
	Data        json.RawMessage          `json:"data"`
	Attachments []*MessageAttachmentWire `json:"attachments"`
}

type MessageRestoreResponseWire APIResponse[MessageRestoreResponseDataWire]

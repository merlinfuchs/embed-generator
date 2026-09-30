package send_message

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
)

// Fluxer's webhooks take Discord's message format, so embeds, allowed mentions and files are
// disgo's types. The requests don't go through disgo's client though, as its rate limits and
// errors follow Discord's. https://docs.fluxer.app/http-api/webhooks/
const (
	fluxerAPIURL   = "https://api.fluxer.app/v1"
	fluxerMediaURL = "https://fluxerusercontent.com"
)

type fluxerClient struct {
	apiURL string
	http   *http.Client
}

func newFluxerClient(apiURL string) *fluxerClient {
	return &fluxerClient{
		apiURL: apiURL,
		http:   &http.Client{Timeout: 30 * time.Second},
	}
}

// fluxerMessageCreate is the body of Fluxer's execute webhook.
type fluxerMessageCreate struct {
	Content         string                   `json:"content,omitempty"`
	Username        string                   `json:"username,omitempty"`
	AvatarURL       string                   `json:"avatar_url,omitempty"`
	TTS             bool                     `json:"tts,omitempty"`
	Embeds          []discord.Embed          `json:"embeds,omitempty"`
	AllowedMentions *discord.AllowedMentions `json:"allowed_mentions,omitempty"`
	Flags           discord.MessageFlags     `json:"flags,omitempty"`
	Attachments     []fluxerAttachmentCreate `json:"attachments,omitempty"`
}

// fluxerAttachmentCreate names the file sent in the files[ID] part.
type fluxerAttachmentCreate struct {
	ID       int    `json:"id"`
	Filename string `json:"filename"`
}

// fluxerMessageEdit is the body of Fluxer's edit webhook message, which takes no files.
type fluxerMessageEdit struct {
	Content         string                   `json:"content"`
	Embeds          []discord.Embed          `json:"embeds"`
	AllowedMentions *discord.AllowedMentions `json:"allowed_mentions,omitempty"`
}

// fluxerMessage is what sending and restoring read from Fluxer's message object.
type fluxerMessage struct {
	ID          common.ID            `json:"id"`
	ChannelID   common.ID            `json:"channel_id"`
	Author      fluxerUser           `json:"author"`
	Content     string               `json:"content"`
	Embeds      []discord.Embed      `json:"embeds"`
	Flags       discord.MessageFlags `json:"flags"`
	Attachments []discord.Attachment `json:"attachments"`
}

type fluxerUser struct {
	ID       common.ID `json:"id"`
	Username string    `json:"username"`
	Avatar   *string   `json:"avatar"`
}

// avatarURL is the avatar the message was sent with, or empty for the webhook's default one.
func (u fluxerUser) avatarURL() string {
	if u.Avatar == nil {
		return ""
	}
	return fmt.Sprintf("%s/avatars/%s/%s.png", fluxerMediaURL, u.ID, *u.Avatar)
}

func (c *fluxerClient) webhookURL(webhookID common.ID, token string) string {
	return fmt.Sprintf("%s/webhooks/%s/%s", c.apiURL, webhookID, token)
}

func (c *fluxerClient) ExecuteWebhook(ctx context.Context, webhookID common.ID, token string, msg fluxerMessageCreate, files []*discord.File) (*fluxerMessage, error) {
	url := c.webhookURL(webhookID, token) + "?wait=true"
	if len(files) == 0 {
		return c.doJSON(ctx, http.MethodPost, url, msg)
	}

	for i, file := range files {
		msg.Attachments = append(msg.Attachments, fluxerAttachmentCreate{ID: i, Filename: file.Name})
	}
	body, err := discord.PayloadWithFiles(msg, files...)
	if err != nil {
		return nil, fmt.Errorf("failed to build multipart body: %w", err)
	}
	return c.do(ctx, http.MethodPost, url, body.ContentType, body.Buffer.Bytes())
}

func (c *fluxerClient) EditWebhookMessage(ctx context.Context, webhookID common.ID, token string, messageID common.ID, edit fluxerMessageEdit) (*fluxerMessage, error) {
	return c.doJSON(ctx, http.MethodPatch, fmt.Sprintf("%s/messages/%s", c.webhookURL(webhookID, token), messageID), edit)
}

func (c *fluxerClient) GetWebhookMessage(ctx context.Context, webhookID common.ID, token string, messageID common.ID) (*fluxerMessage, error) {
	return c.do(ctx, http.MethodGet, fmt.Sprintf("%s/messages/%s", c.webhookURL(webhookID, token), messageID), "", nil)
}

func (c *fluxerClient) doJSON(ctx context.Context, method string, url string, body any) (*fluxerMessage, error) {
	raw, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	return c.do(ctx, method, url, "application/json", raw)
}

func (c *fluxerClient) do(ctx context.Context, method string, url string, contentType string, body []byte) (*fluxerMessage, error) {
	req, err := http.NewRequestWithContext(ctx, method, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	req.Header.Set("User-Agent", "EmbedGenerator (https://message.style)")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to reach Fluxer: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, fmt.Errorf("failed to read Fluxer's response: %w", err)
	}
	if resp.StatusCode >= 300 {
		return nil, fluxerError(resp.StatusCode, raw)
	}

	msg := &fluxerMessage{}
	if err := json.Unmarshal(raw, msg); err != nil {
		return nil, fmt.Errorf("failed to parse Fluxer's message: %w", err)
	}
	return msg, nil
}

// fluxerError turns an error response from Fluxer into one for the user. Anything but a 4xx is
// Fluxer's problem and stays an internal error.
func fluxerError(status int, raw []byte) error {
	var body struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	}
	_ = json.Unmarshal(raw, &body)

	switch {
	case body.Code == "UNKNOWN_WEBHOOK":
		return handlers.NotFound("unknown_webhook", "The webhook does not exist.")
	case body.Code == "UNKNOWN_MESSAGE":
		return handlers.NotFound("unknown_message", "The message does not exist.")
	case status == http.StatusTooManyRequests:
		return handlers.BadRequest("rate_limited", "Fluxer is rate limiting this webhook, try again in a few seconds.")
	case status >= 400 && status < 500:
		message := body.Message
		if message == "" {
			message = http.StatusText(status)
		}
		return handlers.BadRequest("fluxer_error", fmt.Sprintf("Fluxer rejected the request: %s", message))
	}
	return fmt.Errorf("fluxer returned %d: %s", status, raw)
}

// checkFluxerMessage rejects what Fluxer's webhooks can't send, instead of leaving it out.
func checkFluxerMessage(data *actions.MessageWithActions, req wire.MessageSendToWebhookRequestWire) error {
	if data.ComponentsV2Enabled() || len(data.Components) > 0 {
		return handlers.BadRequest("invalid_components", "Fluxer doesn't support components yet. Remove them and turn off Components V2 to send the message to Fluxer.")
	}
	if req.ThreadID.Valid {
		return handlers.BadRequest("invalid_thread", "Fluxer doesn't have threads.")
	}
	if req.MessageID.Valid && len(req.Attachments) > 0 {
		return handlers.BadRequest("invalid_attachments", "Fluxer can't change the files of a message when editing it. Remove the attachments to edit it, or send it as a new message.")
	}
	return nil
}

func (h *SendMessageHandler) sendToFluxerWebhook(c *fiber.Ctx, req wire.MessageSendToWebhookRequestWire, data *actions.MessageWithActions) error {
	if err := checkFluxerMessage(data, req); err != nil {
		return err
	}

	webhookID := common.DefinitelyID(req.WebhookID)

	var msg *fluxerMessage
	var err error
	if req.MessageID.Valid {
		msg, err = h.fluxer.EditWebhookMessage(c.UserContext(), webhookID, req.WebhookToken, req.MessageID.ID, fluxerMessageEdit{
			Content: data.Content,
			// An empty list rather than none, so embeds removed in the editor are removed on Fluxer.
			Embeds:          append([]discord.Embed{}, data.Embeds...),
			AllowedMentions: data.AllowedMentions,
		})
	} else {
		var files []*discord.File
		files, err = decodeAttachments(req.Attachments)
		if err != nil {
			return err
		}

		msg, err = h.fluxer.ExecuteWebhook(c.UserContext(), webhookID, req.WebhookToken, fluxerMessageCreate{
			Content:         data.Content,
			Username:        data.Username,
			AvatarURL:       data.AvatarURL,
			TTS:             data.TTS,
			Embeds:          data.Embeds,
			AllowedMentions: data.AllowedMentions,
			Flags:           data.Flags,
		}, files)
	}
	if err != nil {
		return err
	}

	return c.JSON(wire.MessageSendResponseWire{
		Success: true,
		Data: wire.MessageSendResponseDataWire{
			MessageID: msg.ID,
			ChannelID: msg.ChannelID,
		},
	})
}

func (h *SendMessageHandler) restoreFromFluxerWebhook(c *fiber.Ctx, req wire.MessageRestoreFromWebhookRequestWire) error {
	if req.ThreadID.Valid {
		return handlers.BadRequest("invalid_thread", "Fluxer doesn't have threads.")
	}

	msg, err := h.fluxer.GetWebhookMessage(c.UserContext(), req.WebhookID, req.WebhookToken, req.MessageID)
	if err != nil {
		return err
	}

	return restoreResponse(c, &actions.MessageWithActions{
		Content:   msg.Content,
		Username:  msg.Author.Username,
		AvatarURL: msg.Author.avatarURL(),
		Embeds:    msg.Embeds,
		Flags:     msg.Flags,
	}, msg.Attachments)
}

package send_message

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/vincent-petithory/dataurl"
	"gopkg.in/guregu/null.v4"
)

func (h *SendMessageHandler) HandleRestoreMessageFromChannel(c *fiber.Ctx, req wire.MessageRestoreFromChannelRequestWire) error {
	if err := h.accessManager.CheckChannelAccessForRequest(c, req.ChannelID); err != nil {
		return err
	}

	// We don't use a webhook here because we don't need to, but this means that some restored messages can't actually be edited
	msg, err := h.rest.GetMessage(req.ChannelID, req.MessageID, rest.WithCtx(c.Context()))
	if err != nil {
		return fmt.Errorf("Failed to get message: %w", err)
	}

	components, err := h.actionParser.UnparseMessageComponents(msg.Components)
	if err != nil {
		return fmt.Errorf("Failed to unparse message components: %w", err)
	}

	actionSets, err := h.actionParser.RetrieveActionsForMessage(c.Context(), req.MessageID)
	if err != nil {
		return fmt.Errorf("Failed to retrieve actions for message: %w", err)
	}

	data := &actions.MessageWithActions{
		Content:    msg.Content,
		Username:   msg.Author.Username,
		AvatarURL:  msg.Author.EffectiveAvatarURL(discord.WithSize(512)),
		Embeds:     msg.Embeds,
		Components: components,
		Actions:    actionSets,
	}

	attachments := downloadMessageAttachments(msg.Attachments)

	rawData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("Failed to marshal message data: %w", err)
	}

	return c.JSON(wire.MessageRestoreResponseWire{
		Success: true,
		Data: wire.MessageRestoreResponseDataWire{
			Data:        rawData,
			Attachments: attachments,
		},
	})
}

func (h *SendMessageHandler) HandleRestoreMessageFromWebhook(c *fiber.Ctx, req wire.MessageRestoreFromWebhookRequestWire) error {
	reqOpts := []rest.RequestOpt{
		rest.WithCtx(c.Context()),
	}
	if req.ThreadID.Valid {
		reqOpts = append(reqOpts, rest.WithQueryParam("thread_id", req.ThreadID.String))
	}

	msg, err := h.rest.GetWebhookMessage(req.WebhookID, req.WebhookToken, req.MessageID, reqOpts...)
	if err != nil {
		return err
	}

	data := &actions.MessageWithActions{
		Content:   msg.Content,
		Username:  msg.Author.Username,
		AvatarURL: msg.Author.EffectiveAvatarURL(discord.WithSize(512)),
		Embeds:    msg.Embeds,
	}

	// TODO: components and actions

	attachments := downloadMessageAttachments(msg.Attachments)

	rawData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return c.JSON(wire.MessageRestoreResponseWire{
		Success: true,
		Data: wire.MessageRestoreResponseDataWire{
			Data:        rawData,
			Attachments: attachments,
		},
	})
}

func downloadMessageAttachments(attachments []discord.Attachment) (files []*wire.MessageAttachmentWire) {
	filesC := make(chan *wire.MessageAttachmentWire)

	// TODO: can this block forever?

	for _, attachment := range attachments {
		go func(attachment discord.Attachment) {
			if attachment.Size > 8*1024*1024 {
				filesC <- nil
				return
			}

			// We don't know what to do with attachments without a content type
			if attachment.ContentType == nil {
				filesC <- nil
				return
			}

			resp, err := http.Get(attachment.URL)
			if err != nil {
				filesC <- nil
				return
			}

			body, err := io.ReadAll(resp.Body)
			if err != nil {
				filesC <- nil
				return
			}

			parts := strings.Split(*attachment.ContentType, "/")
			if len(parts) != 2 {
				filesC <- nil
				return
			}

			dataURL := dataurl.New(body, *attachment.ContentType)
			filesC <- &wire.MessageAttachmentWire{
				Name:        attachment.Filename,
				Description: null.String{},
				DataURL:     dataURL.String(),
				Size:        attachment.Size,
			}
		}(attachment)
	}

	for i := 0; i < len(attachments); i++ {
		file := <-filesC
		if file == nil {
			continue
		}
		files = append(files, file)
	}

	return
}

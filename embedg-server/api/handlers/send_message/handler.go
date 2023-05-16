package send_message

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"github.com/vincent-petithory/dataurl"
)

type SendMessageHandler struct {
	bot           *bot.Bot
	pg            *postgres.PostgresStore
	accessManager *access.AccessManager
	actionParser  *parser.ActionParser
}

func New(bot *bot.Bot, accessManager *access.AccessManager, actionParser *parser.ActionParser) *SendMessageHandler {
	return &SendMessageHandler{
		bot:           bot,
		accessManager: accessManager,
		actionParser:  actionParser,
	}
}

func (h *SendMessageHandler) HandleSendMessageToChannel(c *fiber.Ctx, req wire.MessageSendToChannelRequestWire) error {
	session := c.Locals("session").(*session.Session)

	if err := h.accessManager.CheckChannelAccessForRequest(c, req.ChannelID); err != nil {
		return err
	}

	webhook, err := h.bot.GetWebhookForChannel(req.ChannelID)
	if err != nil {
		return err
	}
	threadID := ""
	if webhook.ChannelID != req.ChannelID {
		threadID = req.ChannelID
	}

	data := &actions.MessageWithActions{}
	err = json.Unmarshal([]byte(req.Data), data)
	if err != nil {
		return err
	}

	err = h.actionParser.CheckPermissionsForActionSets(data.Actions, session.UserID, req.ChannelID)
	if err != nil {
		return helpers.BadRequest("invalid_actions", err.Error())
	}

	params := &discordgo.WebhookParams{
		Content:         data.Content,
		Username:        data.Username,
		AvatarURL:       data.AvatarURL,
		TTS:             data.TTS,
		Embeds:          data.Embeds,
		AllowedMentions: data.AllowedMentions,
	}

	attachments := make([]*discordgo.MessageAttachment, len(req.Attachments))

	for i, attachment := range req.Attachments {
		dataURL, err := dataurl.DecodeString(attachment.DataURL)
		if err != nil {
			return helpers.BadRequest("invalid_attachments", "Failed to parse attachment data URL")
		}

		params.Files = append(params.Files, &discordgo.File{
			Name:        attachment.Name,
			ContentType: dataURL.ContentType(),
			Reader:      bytes.NewReader(dataURL.Data),
		})

		attachments[i] = &discordgo.MessageAttachment{
			ID: fmt.Sprintf("%d", i),
		}
	}

	components, err := h.actionParser.ParseMessageComponents(data.Components)
	if err != nil {
		return helpers.BadRequest("invalid_actions", err.Error())
	}

	params.Components = components

	var msg *discordgo.Message
	if threadID != "" {
		if req.MessageID.Valid {
			msg, err = h.bot.Session.WebhookThreadMessageEdit(webhook.ID, webhook.Token, threadID, req.MessageID.String, &discordgo.WebhookEdit{
				Content:         &params.Content,
				Embeds:          &params.Embeds,
				Components:      &params.Components,
				AllowedMentions: params.AllowedMentions,
				Files:           params.Files,
				Attachments:     &attachments,
			})
		} else {
			msg, err = h.bot.Session.WebhookThreadExecute(webhook.ID, webhook.Token, true, threadID, params)
		}
	} else {
		if req.MessageID.Valid {
			msg, err = h.bot.Session.WebhookMessageEdit(webhook.ID, webhook.Token, req.MessageID.String, &discordgo.WebhookEdit{
				Content:         &params.Content,
				Embeds:          &params.Embeds,
				Components:      &params.Components,
				AllowedMentions: params.AllowedMentions,
				Files:           params.Files,
				Attachments:     &attachments,
			})
		} else {
			msg, err = h.bot.Session.WebhookExecute(webhook.ID, webhook.Token, true, params)
		}
	}
	if err != nil {
		return err
	}

	err = h.actionParser.CreateActionsForMessage(data.Actions, msg.ID)
	if err != nil {
		log.Error().Err(err).Msg("failed to create actions for message")
		return err
	}

	return c.JSON(wire.MessageSendResponseWire{
		Success: true,
		Data: wire.MessageSendResponseDataWire{
			MessageID: msg.ID,
		},
	})
}

func (h *SendMessageHandler) HandleSendMessageToWebhook(c *fiber.Ctx, req wire.MessageSendToWebhookRequestWire) error {
	data := &actions.MessageWithActions{}
	err := json.Unmarshal([]byte(req.Data), data)
	if err != nil {
		return err
	}

	params := &discordgo.WebhookParams{
		Content:         data.Content,
		Username:        data.Username,
		AvatarURL:       data.AvatarURL,
		TTS:             data.TTS,
		Embeds:          data.Embeds,
		AllowedMentions: data.AllowedMentions,
	}

	attachments := make([]*discordgo.MessageAttachment, len(req.Attachments))

	for i, attachment := range req.Attachments {
		dataURL, err := dataurl.DecodeString(attachment.DataURL)
		if err != nil {
			return helpers.BadRequest("invalid_attachments", "Failed to parse attachment data URL")
		}

		params.Files = append(params.Files, &discordgo.File{
			Name:        attachment.Name,
			ContentType: dataURL.ContentType(),
			Reader:      bytes.NewReader(dataURL.Data),
		})

		attachments[i] = &discordgo.MessageAttachment{
			ID: fmt.Sprintf("%d", i),
		}
	}

	var msg *discordgo.Message
	if req.ThreadID.Valid {
		if req.MessageID.Valid {
			msg, err = h.bot.Session.WebhookThreadMessageEdit(req.WebhookID, req.WebhookToken, req.ThreadID.String, req.MessageID.String, &discordgo.WebhookEdit{
				Content:         &params.Content,
				Embeds:          &params.Embeds,
				Components:      &params.Components,
				AllowedMentions: params.AllowedMentions,
				Files:           params.Files,
				Attachments:     &attachments,
			})
		} else {
			msg, err = h.bot.Session.WebhookThreadExecute(req.WebhookID, req.WebhookToken, true, req.ThreadID.String, params)
		}
	} else {
		if req.MessageID.Valid {
			msg, err = h.bot.Session.WebhookMessageEdit(req.WebhookID, req.WebhookToken, req.MessageID.String, &discordgo.WebhookEdit{
				Content:         &params.Content,
				Embeds:          &params.Embeds,
				Components:      &params.Components,
				AllowedMentions: params.AllowedMentions,
				Files:           params.Files,
				Attachments:     &attachments,
			})
		} else {
			msg, err = h.bot.Session.WebhookExecute(req.WebhookID, req.WebhookToken, true, params)
		}
	}
	if err != nil {
		return err
	}

	return c.JSON(wire.MessageSendResponseWire{
		Success: true,
		Data: wire.MessageSendResponseDataWire{
			MessageID: msg.ID,
		},
	})
}

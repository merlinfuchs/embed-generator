package send_message

import (
	"bytes"
	"database/sql"
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
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"github.com/vincent-petithory/dataurl"
)

type SendMessageHandler struct {
	bot           *bot.Bot
	pg            *postgres.PostgresStore
	accessManager *access.AccessManager
	actionParser  *parser.ActionParser
}

func New(bot *bot.Bot, pg *postgres.PostgresStore, accessManager *access.AccessManager, actionParser *parser.ActionParser) *SendMessageHandler {
	return &SendMessageHandler{
		bot:           bot,
		pg:            pg,
		accessManager: accessManager,
		actionParser:  actionParser,
	}
}

func (h *SendMessageHandler) HandleSendMessageToChannel(c *fiber.Ctx, req wire.MessageSendToChannelRequestWire) error {
	session := c.Locals("session").(*session.Session)

	if err := h.accessManager.CheckChannelAccessForRequest(c, req.ChannelID); err != nil {
		return err
	}

	var webhook *discordgo.Webhook
	if req.MessageID.Valid {
		msg, err := h.bot.Session.ChannelMessage(req.ChannelID, req.MessageID.String)
		if err != nil {
			if util.IsDiscordRestErrorCode(err, 10008) {
				return helpers.NotFound("unknown_message", "The message you are trying to edit doesn't exist.")
			}
			return fmt.Errorf("Failed to get message from channel: %w", err)
		}

		if msg.WebhookID == "" {
			return helpers.BadRequest("author_no_webhook", "Message wasn't sent by a webhook and can therefore not be edited.")
		}

		webhook, err = h.bot.GetWebhookForChannel(req.ChannelID, msg.WebhookID)
		if err != nil {
			return helpers.BadRequest("webhook_failed", err.Error())
		}
	} else {
		var err error
		webhook, err = h.bot.FindWebhookForChannel(req.ChannelID)
		if err != nil {
			return fmt.Errorf("Failed to get webhook for channel: %w", err)
		}
	}

	threadID := ""
	if webhook.ChannelID != req.ChannelID {
		threadID = req.ChannelID
	}

	data := &actions.MessageWithActions{}
	err := json.Unmarshal([]byte(req.Data), data)
	if err != nil {
		return err
	}

	params := &discordgo.WebhookParams{
		Content:         data.Content,
		Username:        data.Username,
		AvatarURL:       data.AvatarURL,
		ThreadName:      req.ThreadName.String,
		TTS:             data.TTS,
		Embeds:          data.Embeds,
		AllowedMentions: data.AllowedMentions,
	}

	customBot, err := h.pg.Q.GetCustomBotByGuildID(c.Context(), req.GuildID)
	if err != nil {
		if err != sql.ErrNoRows {
			log.Error().Err(err).Msg("failed to get custom bot for message username and avatar")
		}
	} else {
		if params.Username == "" {
			params.Username = customBot.UserName
		}
		if params.AvatarURL == "" {
			params.AvatarURL = util.DiscordAvatarURL(customBot.UserID, customBot.UserDiscriminator, customBot.UserAvatar.String)
		}
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
		return fmt.Errorf("Failed to send message: %w", err)
	}

	permContext, err := h.actionParser.DerivePermissionsForActions(session.UserID, req.GuildID, req.ChannelID)
	if err != nil {
		return fmt.Errorf("Failed to create permission context: %w", err)
	}

	err = h.actionParser.CreateActionsForMessage(c.Context(), data.Actions, permContext, msg.ID, false)
	if err != nil {
		log.Error().Err(err).Msg("failed to create actions for message")
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
			ChannelID: msg.ChannelID,
		},
	})
}

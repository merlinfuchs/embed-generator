package send_message

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/template"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"github.com/vincent-petithory/dataurl"
)

type SendMessageHandler struct {
	bot           *bot.Bot
	pg            *postgres.PostgresStore
	accessManager *access.AccessManager
	actionParser  *parser.ActionParser
	planStore     store.PlanStore
}

func New(
	bot *bot.Bot,
	pg *postgres.PostgresStore,
	accessManager *access.AccessManager,
	actionParser *parser.ActionParser,
	planStore store.PlanStore,
) *SendMessageHandler {
	return &SendMessageHandler{
		bot:           bot,
		pg:            pg,
		accessManager: accessManager,
		actionParser:  actionParser,
		planStore:     planStore,
	}
}

func (h *SendMessageHandler) HandleSendMessageToChannel(c *fiber.Ctx, req wire.MessageSendToChannelRequestWire) error {
	session := c.Locals("session").(*session.Session)

	if err := h.accessManager.CheckChannelAccessForRequest(c, req.ChannelID); err != nil {
		return err
	}

	channel, err := h.bot.State.Channel(req.ChannelID)
	if err != nil {
		return fmt.Errorf("Failed to get channel: %w", err)
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.Context(), channel.GuildID)
	if err != nil {
		return fmt.Errorf("could not get plan features: %w", err)
	}

	templates := template.NewContext(
		"SEND_MESSAGE", features.MaxTemplateOps,
		template.NewGuildProvider(h.bot.State, channel.GuildID, nil),
		template.NewChannelProvider(h.bot.State, req.ChannelID, nil),
		template.NewKVProvider(channel.GuildID, h.pg, features.MaxKVKeys),
	)

	data := &actions.MessageWithActions{}
	err = json.Unmarshal([]byte(req.Data), data)
	if err != nil {
		return err
	}

	err = templates.ParseAndExecuteMessage(data)
	if err != nil {
		return fmt.Errorf("Failed to parse and execute message template: %w", err)
	}

	params := &discordgo.WebhookParams{
		Username:        data.Username,
		AvatarURL:       data.AvatarURL,
		ThreadName:      req.ThreadName.String,
		AllowedMentions: data.AllowedMentions,
		Flags:           data.Flags,
	}
	if !data.ComponentsV2Enabled() {
		params.Content = data.Content
		params.Embeds = data.Embeds
		params.TTS = data.TTS
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

	params.Components, err = h.actionParser.ParseMessageComponents(data.Components)
	if err != nil {
		return helpers.BadRequest("invalid_actions", err.Error())
	}

	var msg *discordgo.Message
	if req.MessageID.Valid {
		msg, err = h.bot.EditMessageInChannel(c.Context(), req.ChannelID, req.MessageID.String, &discordgo.WebhookEdit{
			Content:         &params.Content,
			Embeds:          &params.Embeds,
			Components:      &params.Components,
			AllowedMentions: params.AllowedMentions,
			Files:           params.Files,
			Attachments:     &attachments,
		})
	} else {
		msg, err = h.bot.SendMessageToChannel(c.Context(), req.ChannelID, params)
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
		Username:        data.Username,
		AvatarURL:       data.AvatarURL,
		AllowedMentions: data.AllowedMentions,
		Flags:           data.Flags,
	}
	if !data.ComponentsV2Enabled() {
		params.Content = data.Content
		params.Embeds = data.Embeds
		params.TTS = data.TTS
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

	if req.WebhookType == "guilded" {
		err := util.ExecuteGuildedWebhook(req.WebhookID, req.WebhookToken, params)
		if err != nil {
			return err
		}

		return c.JSON(wire.MessageSendResponseWire{
			Success: true,
			Data:    wire.MessageSendResponseDataWire{},
		})
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

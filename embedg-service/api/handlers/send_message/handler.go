package send_message

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/template"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/webhook"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/rs/zerolog/log"
	"github.com/vincent-petithory/dataurl"
)

type SendMessageHandler struct {
	rest           rest.Rest
	caches         cache.Caches
	kvEntryStore   store.KVEntryStore
	webhookManager *webhook.WebhookManager
	accessManager  *access.AccessManager
	actionParser   *parser.ActionParser
	planStore      store.PlanStore
}

func New(
	rest rest.Rest,
	caches cache.Caches,
	kvEntryStore store.KVEntryStore,
	webhookManager *webhook.WebhookManager,
	accessManager *access.AccessManager,
	actionParser *parser.ActionParser,
	planStore store.PlanStore,
) *SendMessageHandler {
	return &SendMessageHandler{
		rest:           rest,
		caches:         caches,
		kvEntryStore:   kvEntryStore,
		webhookManager: webhookManager,
		accessManager:  accessManager,
		actionParser:   actionParser,
		planStore:      planStore,
	}
}

func (h *SendMessageHandler) HandleSendMessageToChannel(c *fiber.Ctx, req wire.MessageSendToChannelRequestWire) error {
	session := c.Locals("session").(*session.Session)

	if err := h.accessManager.CheckChannelAccessForRequest(c, req.ChannelID); err != nil {
		return err
	}

	channel, ok := h.caches.Channel(req.ChannelID)
	if !ok {
		return handlers.BadRequest("channel_not_found", "Channel not found")
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.Context(), channel.GuildID())
	if err != nil {
		return fmt.Errorf("could not get plan features: %w", err)
	}

	templates := template.NewContext(
		"SEND_MESSAGE", features.MaxTemplateOps,
		template.NewGuildProvider(h.caches, channel.GuildID(), nil),
		template.NewChannelProvider(h.caches, req.ChannelID, nil),
		template.NewKVProvider(channel.GuildID(), h.kvEntryStore, features.MaxKVKeys),
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

	params := discord.WebhookMessageCreate{
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

	attachments := make([]discord.AttachmentUpdate, len(req.Attachments))

	for i, attachment := range req.Attachments {
		dataURL, err := dataurl.DecodeString(attachment.DataURL)
		if err != nil {
			return handlers.BadRequest("invalid_attachments", "Failed to parse attachment data URL")
		}

		params.Files = append(params.Files, &discord.File{
			Name: attachment.Name,
			// ContentType: dataURL.ContentType(),
			Reader: bytes.NewReader(dataURL.Data),
		})

		attachments[i] = discord.AttachmentKeep{
			ID: common.ID(i),
		}
	}

	params.Components, err = h.actionParser.ParseMessageComponents(data.Components, features.ComponentTypes)
	if err != nil {
		return handlers.BadRequest("invalid_actions", err.Error())
	}

	var msg *discord.Message
	if req.MessageID.Valid {
		msg, err = h.webhookManager.UpdateMessageInChannel(c.Context(), req.ChannelID, req.MessageID.ID, discord.WebhookMessageUpdate{
			Content:         &params.Content,
			Embeds:          &params.Embeds,
			Components:      &params.Components,
			AllowedMentions: params.AllowedMentions,
			Files:           params.Files,
			Attachments:     &attachments,
		})
	} else {
		msg, err = h.webhookManager.SendMessageToChannel(c.Context(), req.ChannelID, params)
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

	params := discord.WebhookMessageCreate{
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

	attachments := make([]discord.AttachmentUpdate, len(req.Attachments))

	for i, attachment := range req.Attachments {
		dataURL, err := dataurl.DecodeString(attachment.DataURL)
		if err != nil {
			return handlers.BadRequest("invalid_attachments", "Failed to parse attachment data URL")
		}

		params.Files = append(params.Files, &discord.File{
			Name: attachment.Name,
			// ContentType: dataURL.ContentType(),
			Reader: bytes.NewReader(dataURL.Data),
		})

		attachments[i] = discord.AttachmentKeep{
			ID: common.ID(i),
		}
	}

	if req.WebhookType == "guilded" {
		err := common.ExecuteGuildedWebhook(c.Context(), req.WebhookID, req.WebhookToken, params)
		if err != nil {
			return err
		}

		return c.JSON(wire.MessageSendResponseWire{
			Success: true,
			Data:    wire.MessageSendResponseDataWire{},
		})
	}

	var msg *discord.Message
	if req.MessageID.Valid {
		msg, err = h.rest.UpdateWebhookMessage(
			common.DefinitelyID(req.WebhookID),
			req.WebhookToken,
			req.MessageID.ID,
			discord.WebhookMessageUpdate{
				Content:         &params.Content,
				Embeds:          &params.Embeds,
				Components:      &params.Components,
				AllowedMentions: params.AllowedMentions,
				Files:           params.Files,
				Attachments:     &attachments,
			},
			rest.UpdateWebhookMessageParams{
				ThreadID:       req.ThreadID.ID,
				WithComponents: false,
			},
		)
	} else {
		msg, err = h.rest.CreateWebhookMessage(
			common.DefinitelyID(req.WebhookID),
			req.WebhookToken,
			params,
			rest.CreateWebhookMessageParams{
				Wait:           true,
				ThreadID:       req.ThreadID.ID,
				WithComponents: false,
			},
		)
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

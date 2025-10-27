package send_message

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/snowflake/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/template"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/embedg"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"github.com/vincent-petithory/dataurl"
)

type SendMessageHandler struct {
	embedg        *embedg.EmbedGenerator
	pg            *postgres.PostgresStore
	accessManager *access.AccessManager
	actionParser  *parser.ActionParser
	planStore     store.PlanStore
}

func New(
	embedg *embedg.EmbedGenerator,
	pg *postgres.PostgresStore,
	accessManager *access.AccessManager,
	actionParser *parser.ActionParser,
	planStore store.PlanStore,
) *SendMessageHandler {
	return &SendMessageHandler{
		embedg:        embedg,
		pg:            pg,
		accessManager: accessManager,
		actionParser:  actionParser,
		planStore:     planStore,
	}
}

func (h *SendMessageHandler) HandleSendMessageToChannel(c *fiber.Ctx, req wire.MessageSendToChannelRequestWire) error {
	session := c.Locals("session").(*session.Session)

	if err := h.accessManager.CheckChannelAccessForRequest(c, util.ToID(req.ChannelID)); err != nil {
		return err
	}

	channel, ok := h.embedg.Caches().Channel(util.ToID(req.ChannelID))
	if !ok {
		return helpers.BadRequest("channel_not_found", "Channel not found")
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.Context(), channel.GuildID())
	if err != nil {
		return fmt.Errorf("could not get plan features: %w", err)
	}

	templates := template.NewContext(
		"SEND_MESSAGE", features.MaxTemplateOps,
		template.NewGuildProvider(h.embedg.Caches(), channel.GuildID(), nil),
		template.NewChannelProvider(h.embedg.Caches(), util.ToID(req.ChannelID), nil),
		template.NewKVProvider(channel.GuildID(), h.pg, features.MaxKVKeys),
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
			return helpers.BadRequest("invalid_attachments", "Failed to parse attachment data URL")
		}

		params.Files = append(params.Files, &discord.File{
			Name: attachment.Name,
			// ContentType: dataURL.ContentType(),
			Reader: bytes.NewReader(dataURL.Data),
		})

		attachments[i] = discord.AttachmentKeep{
			ID: util.ID(i),
		}
	}

	params.Components, err = h.actionParser.ParseMessageComponents(data.Components, features.ComponentTypes)
	if err != nil {
		return helpers.BadRequest("invalid_actions", err.Error())
	}

	var msg *discord.Message
	if req.MessageID.Valid {
		msg, err = h.embedg.UpdateMessageInChannel(c.Context(), util.ToID(req.ChannelID), util.ToID(req.MessageID.String), discord.WebhookMessageUpdate{
			Content:         &params.Content,
			Embeds:          &params.Embeds,
			Components:      &params.Components,
			AllowedMentions: params.AllowedMentions,
			Files:           params.Files,
			Attachments:     &attachments,
		})
	} else {
		msg, err = h.embedg.SendMessageToChannel(c.Context(), util.ToID(req.ChannelID), params)
	}
	if err != nil {
		return fmt.Errorf("Failed to send message: %w", err)
	}

	permContext, err := h.actionParser.DerivePermissionsForActions(session.UserID, util.ToID(req.GuildID), util.ToID(req.ChannelID))
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
			MessageID: msg.ID.String(),
			ChannelID: msg.ChannelID.String(),
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
			return helpers.BadRequest("invalid_attachments", "Failed to parse attachment data URL")
		}

		params.Files = append(params.Files, &discord.File{
			Name: attachment.Name,
			// ContentType: dataURL.ContentType(),
			Reader: bytes.NewReader(dataURL.Data),
		})

		attachments[i] = discord.AttachmentKeep{
			ID: util.ID(i),
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

	var threadID snowflake.ID
	if req.ThreadID.Valid {
		threadID = util.ToID(req.ThreadID.String)
	}

	var msg *discord.Message
	if req.MessageID.Valid {
		msg, err = h.embedg.Rest().UpdateWebhookMessage(
			util.ToID(req.WebhookID),
			req.WebhookToken,
			util.ToID(req.MessageID.String),
			discord.WebhookMessageUpdate{
				Content:         &params.Content,
				Embeds:          &params.Embeds,
				Components:      &params.Components,
				AllowedMentions: params.AllowedMentions,
				Files:           params.Files,
				Attachments:     &attachments,
			},
			rest.UpdateWebhookMessageParams{
				ThreadID:       threadID,
				WithComponents: false,
			},
		)
	} else {
		msg, err = h.embedg.Rest().CreateWebhookMessage(
			util.ToID(req.WebhookID),
			req.WebhookToken,
			params,
			rest.CreateWebhookMessageParams{
				Wait:           true,
				ThreadID:       threadID,
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
			MessageID: msg.ID.String(),
			ChannelID: msg.ChannelID.String(),
		},
	})
}

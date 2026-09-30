package send_message

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"

	"log/slog"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/template"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-server/manager/webhook"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"github.com/vincent-petithory/dataurl"
)

type SendMessageHandler struct {
	rest           rest.Rest
	fluxerRest     rest.Rest
	guildState     *guildstate.Provider
	kvEntryStore   store.KVEntryStore
	webhookManager *webhook.WebhookManager
	accessManager  *access.AccessManager
	actionParser   *parser.ActionParser
	planStore      store.PlanStore
}

func New(
	rest rest.Rest,
	guildState *guildstate.Provider,
	kvEntryStore store.KVEntryStore,
	webhookManager *webhook.WebhookManager,
	accessManager *access.AccessManager,
	actionParser *parser.ActionParser,
	planStore store.PlanStore,
) *SendMessageHandler {
	return &SendMessageHandler{
		rest:           rest,
		fluxerRest:     newFluxerRest(fluxerAPIURL),
		guildState:     guildState,
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

	channel, err := h.guildState.Channel(c.UserContext(), req.ChannelID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.BadRequest("channel_not_found", "Channel not found")
		}
		return err
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.UserContext(), channel.GuildID())
	if err != nil {
		return fmt.Errorf("could not get plan features: %w", err)
	}

	templateSource := template.NewSource(c.UserContext(), h.guildState)
	templates := template.NewContext(
		"SEND_MESSAGE", features.MaxTemplateOps,
		template.NewGuildProvider(templateSource, channel.GuildID(), nil),
		template.NewChannelProvider(templateSource, req.ChannelID, channel),
		template.NewKVProvider(channel.GuildID(), h.kvEntryStore, features.MaxKVKeys),
	)

	data := &actions.MessageWithActions{}
	err = json.Unmarshal([]byte(req.Data), data)
	if err != nil {
		return err
	}

	if err := checkMessageLimits(data, features); err != nil {
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

	for _, attachment := range req.Attachments {
		dataURL, err := dataurl.DecodeString(attachment.DataURL)
		if err != nil {
			return handlers.BadRequest("invalid_attachments", "Failed to parse attachment data URL")
		}

		params.Files = append(params.Files, &discord.File{
			Name: attachment.Name,
			// ContentType: dataURL.ContentType(),
			Reader: bytes.NewReader(dataURL.Data),
		})
	}

	params.Components, err = h.actionParser.ParseMessageComponents(data.Components, true)
	if err != nil {
		return handlers.BadRequest("invalid_actions", err.Error())
	}

	var msg *discord.Message
	if req.MessageID.Valid {
		msg, err = h.webhookManager.UpdateMessageInChannel(c.UserContext(), req.ChannelID, req.MessageID.ID, discord.WebhookMessageUpdate{
			Content:         &params.Content,
			Embeds:          &params.Embeds,
			Components:      &params.Components,
			AllowedMentions: params.AllowedMentions,
			Files:           params.Files,
			Flags:           componentsV2Flag(data),
		})
	} else {
		msg, err = h.webhookManager.SendMessageToChannel(c.UserContext(), req.ChannelID, params)
	}
	if err != nil {
		if common.IsDiscordRestErrorCode(err, rest.JSONErrorCodeUnknownMessage) {
			return handlers.NotFound("unknown_message", "The message to edit does not exist.")
		}
		return fmt.Errorf("Failed to send or edit message: %w", err)
	}

	member, err := h.accessManager.GetMemberForUser(c.UserContext(), session, req.GuildID)
	if err != nil {
		return fmt.Errorf("Failed to get member: %w", err)
	}

	permContext, err := h.actionParser.DerivePermissionsForActions(c.UserContext(), *member, req.GuildID, req.ChannelID)
	if err != nil {
		return fmt.Errorf("Failed to create permission context: %w", err)
	}

	err = h.actionParser.CreateActionsForMessage(c.UserContext(), data.Actions, permContext, msg.ID, false)
	if err != nil {
		slog.Error("failed to create actions for message", slog.Any("error", err))
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

	fluxer := req.WebhookPlatform == wire.WebhookPlatformFluxer
	if fluxer {
		if err := checkFluxerMessage(data, req); err != nil {
			return err
		}
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

	// Only the bot can handle interactive components, but webhooks send the rest. Checked before
	// the attachments are decoded, as the request fails either way.
	params.Components, err = h.actionParser.ParseMessageComponents(data.Components, false)
	if errors.Is(err, parser.ErrInteractiveNotAllowed) {
		return handlers.BadRequest("invalid_components", "Buttons with actions and select menus only work when the bot sends the message. Select a server and channel instead of a webhook.")
	}
	if err != nil {
		return handlers.BadRequest("invalid_components", err.Error())
	}

	for _, attachment := range req.Attachments {
		dataURL, err := dataurl.DecodeString(attachment.DataURL)
		if err != nil {
			return handlers.BadRequest("invalid_attachments", "Failed to parse attachment data URL")
		}

		params.Files = append(params.Files, &discord.File{
			Name: attachment.Name,
			// ContentType: dataURL.ContentType(),
			Reader: bytes.NewReader(dataURL.Data),
		})
	}

	client := h.webhookRest(req.WebhookPlatform)

	var msg *discord.Message
	if req.MessageID.Valid {
		update := discord.WebhookMessageUpdate{
			Content:         &params.Content,
			Embeds:          &params.Embeds,
			AllowedMentions: params.AllowedMentions,
			Files:           params.Files,
			Flags:           componentsV2Flag(data),
		}
		// Fluxer's edits only take content, embeds, flags and allowed mentions.
		if !fluxer {
			update.Components = &params.Components
		}

		msg, err = client.UpdateWebhookMessage(
			common.DefinitelyID(req.WebhookID),
			req.WebhookToken,
			req.MessageID.ID,
			update,
			rest.UpdateWebhookMessageParams{
				ThreadID:       req.ThreadID.ID,
				WithComponents: !fluxer,
			},
		)
	} else {
		msg, err = client.CreateWebhookMessage(
			common.DefinitelyID(req.WebhookID),
			req.WebhookToken,
			params,
			rest.CreateWebhookMessageParams{
				Wait:           true,
				ThreadID:       req.ThreadID.ID,
				WithComponents: !fluxer,
			},
		)
	}
	if err != nil {
		if fluxer {
			return fluxerError(err)
		}
		if common.IsDiscordRestErrorCode(err, rest.JSONErrorCodeUnknownWebhook) {
			return handlers.NotFound("unknown_webhook", "The webhook does not exist.")
		}
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

// componentsV2Flag turns an edited message into a Components V2 one, which Discord needs to be told
// on edits too. It can't be turned back, so it's left out otherwise.
func componentsV2Flag(data *actions.MessageWithActions) *discord.MessageFlags {
	if !data.ComponentsV2Enabled() {
		return nil
	}
	flags := discord.MessageFlagIsComponentsV2
	return &flags
}

func checkMessageLimits(data *actions.MessageWithActions, features model.PlanFeatures) error {
	for _, actionSet := range data.Actions {
		if err := handlers.CheckActionSetLimit(actionSet, features); err != nil {
			return err
		}
	}

	return nil
}

package send_message

import (
	"encoding/json"

	"github.com/bwmarrin/discordgo"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
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

	webhook, err := h.getWebhookForChannel(req.ChannelID)
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
		log.Error().Err(err).Msg("Failed to check permissions for action sets")
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

	components, err := h.actionParser.ParseMessageComponents(data.Components)
	if err != nil {
		log.Error().Err(err).Msg("Failed to parse message components")
		return err
	}

	params.Components = components

	var msg *discordgo.Message
	if threadID != "" {
		msg, err = h.bot.Session.WebhookThreadExecute(webhook.ID, webhook.Token, true, threadID, params)
	} else {
		msg, err = h.bot.Session.WebhookExecute(webhook.ID, webhook.Token, true, params)
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

func (h *SendMessageHandler) getWebhookForChannel(channelID string) (*discordgo.Webhook, error) {
	channel, err := h.bot.State.Channel(channelID)
	if err != nil {
		return nil, err
	}
	if channel.Type == discordgo.ChannelTypeGuildNewsThread || channel.Type == discordgo.ChannelTypeGuildPublicThread {
		channel, err = h.bot.State.Channel(channel.ParentID)
		if err != nil {
			return nil, err
		}
	}

	webhooks, err := h.bot.Session.ChannelWebhooks(channel.ID)
	if err != nil {
		return nil, err
	}
	if len(webhooks) > 0 {
		return webhooks[0], nil
	}

	webhook, err := h.bot.Session.WebhookCreate(channel.ID, "Embed Generator", "")
	return webhook, err
}

func (h *SendMessageHandler) HandleSendMessageToWebhook(c *fiber.Ctx, req wire.MessageSendToWebhookRequestWire) error {
	return nil
}

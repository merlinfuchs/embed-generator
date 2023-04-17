package send_message

import (
	"encoding/json"

	"github.com/bwmarrin/discordgo"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
)

type SendMessageHandler struct {
	bot *bot.Bot
	am  *access.AccessManager
}

func New(bot *bot.Bot, am *access.AccessManager) *SendMessageHandler {
	return &SendMessageHandler{
		bot: bot,
		am:  am,
	}
}

func (h *SendMessageHandler) HandleSendMessageToChannel(c *fiber.Ctx, req wire.MessageSendToChannelRequestWire) error {
	if err := h.am.CheckChannelAccessForRequest(c, req.ChannelID); err != nil {
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

	params := &discordgo.WebhookParams{}
	err = json.Unmarshal([]byte(req.Data), params)
	if err != nil {
		return err
	}

	var msg *discordgo.Message
	if threadID != "" {
		msg, err = h.bot.Session.WebhookThreadExecute(webhook.ID, webhook.Token, true, threadID, params)
	} else {
		msg, err = h.bot.Session.WebhookExecute(webhook.ID, webhook.Token, true, params)
	}

	return c.JSON(wire.MessageSendResponseWire{
		MessageID: msg.ID,
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

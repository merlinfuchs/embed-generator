package send_message

import (
	"encoding/json"

	"github.com/bwmarrin/discordgo"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

type SendMessageHandler struct {
	bot           *bot.Bot
	pg            *postgres.PostgresStore
	accessManager *access.AccessManager
	actionManager *actions.ActionManager
}

func New(bot *bot.Bot, accessManager *access.AccessManager, actionManger *actions.ActionManager) *SendMessageHandler {
	return &SendMessageHandler{
		bot:           bot,
		accessManager: accessManager,
		actionManager: actionManger,
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

	params := &discordgo.WebhookParams{}
	err = json.Unmarshal([]byte(req.Data), params)
	if err != nil {
		return err
	}

	components, actionSets, err := h.actionManager.ParseMessageComponentActions(req.Data, session.UserID, req.ChannelID)
	if err != nil {
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

	// TODO: move into access manager
	// TODO: delete action set on message delete
	for _, actionSet := range actionSets {
		rawActions, err := json.Marshal(actionSet.Actions)
		if err != nil {
			return err
		}

		_, err = h.pg.Q.InsertMessageActionSet(c.Context(), postgres.InsertMessageActionSetParams{
			ID:        util.UniqueID(),
			MessageID: msg.ID,
			SetID:     actionSet.ID,
			Actions:   rawActions,
		})
		if err != nil {
			return err
		}
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

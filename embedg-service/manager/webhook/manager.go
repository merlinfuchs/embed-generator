package webhook

import (
	"context"

	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
)

type WebhookManager struct {
	rest rest.Rest
}

func NewWebhookManager(rest rest.Rest) *WebhookManager {
	return &WebhookManager{
		rest: rest,
	}
}

func (m *WebhookManager) SendMessageToChannel(ctx context.Context, channelID common.ID, params discord.WebhookMessageCreate) (*discord.Message, error) {
	return nil, nil
}

func (m *WebhookManager) OnEvent(event bot.Event) {}

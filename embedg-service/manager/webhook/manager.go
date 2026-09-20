package webhook

import (
	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/custom_bot"
)

type WebhookManager struct {
	rest             rest.Rest
	guildState       *guildstate.Provider
	customBotManager *custom_bot.CustomBotManager
}

func NewWebhookManager(rest rest.Rest, guildState *guildstate.Provider, customBotManager *custom_bot.CustomBotManager) *WebhookManager {
	return &WebhookManager{
		rest:             rest,
		guildState:       guildState,
		customBotManager: customBotManager,
	}
}

func (m *WebhookManager) OnEvent(event bot.Event) {}

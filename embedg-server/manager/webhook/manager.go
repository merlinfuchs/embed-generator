package webhook

import (
	"time"

	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-server/manager/custom_bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"golang.org/x/sync/singleflight"
)

const (
	// Webhooks rarely change and a stale one is detected and replaced on use, so the TTL only bounds
	// how long an unused entry lingers.
	webhookTTL      = time.Hour
	webhookCapacity = 50_000
)

type WebhookManager struct {
	rest             rest.Rest
	guildState       *guildstate.Provider
	customBotManager *custom_bot.CustomBotManager

	singleFlight singleflight.Group
	webhooks     *ttlcache.Cache[string, *discord.IncomingWebhook]
}

func NewWebhookManager(rest rest.Rest, guildState *guildstate.Provider, customBotManager *custom_bot.CustomBotManager) *WebhookManager {
	webhooks := ttlcache.New(
		ttlcache.WithTTL[string, *discord.IncomingWebhook](webhookTTL),
		ttlcache.WithCapacity[string, *discord.IncomingWebhook](webhookCapacity),
	)
	go webhooks.Start()

	return &WebhookManager{
		rest:             rest,
		guildState:       guildState,
		customBotManager: customBotManager,
		webhooks:         webhooks,
	}
}

func (m *WebhookManager) OnEvent(event bot.Event) {}

// sendWebhookKey is per application, not just per channel: component interactions on a message go
// to the application that owns the webhook it was sent with.
func sendWebhookKey(channelID common.ID, customBot *model.CustomBot) string {
	app := "main"
	if customBot != nil {
		app = customBot.ApplicationID.String()
	}
	return "send:" + channelID.String() + ":" + app
}

// editWebhookKey is per webhook, as a message can only be edited through the webhook that sent it.
func editWebhookKey(channelID common.ID, webhookID common.ID) string {
	return "edit:" + channelID.String() + ":" + webhookID.String()
}

package api

import (
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/premium"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/custom_bots"
	"github.com/merlinfuchs/embed-generator/embedg-server/embedg"
	"github.com/merlinfuchs/embed-generator/embedg-server/scheduled_messages"
)

type managers struct {
	session           *session.SessionManager
	access            *access.AccessManager
	premium           *premium.PremiumManager
	customBots        *custom_bots.CustomBotManager
	scheduledMessages *scheduled_messages.ScheduledMessageManager

	actionParser  *parser.ActionParser
	actionHandler *handler.ActionHandler
}

func createManagers(stores *Stores, embedg *embedg.EmbedGenerator) *managers {
	sessionManager := session.New(stores.PG)
	accessManager := access.New(embedg.Caches(), embedg.Rest())
	premiumManager := premium.New(stores.PG, embedg.Rest())

	actionParser := parser.New(accessManager, stores.PG, embedg.Caches())
	actionHandler := handler.New(stores.PG, actionParser, premiumManager)

	customBots := custom_bots.NewCustomBotManager(stores.PG, actionHandler)
	scheduledMessages := scheduled_messages.NewScheduledMessageManager(
		stores.PG,
		actionParser,
		embedg,
		premiumManager,
	)

	embedg.SetActionHandler(actionHandler)
	embedg.SetActionParser(actionParser)

	return &managers{
		session:           sessionManager,
		access:            accessManager,
		premium:           premiumManager,
		customBots:        customBots,
		scheduledMessages: scheduledMessages,
		actionParser:      actionParser,
		actionHandler:     actionHandler,
	}
}

package api

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/assistant"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/auth"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/custom_bots"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/guilds"
	premium_handler "github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/premium"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/saved_messages"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/send_message"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/shared_messages"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/users"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/premium"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/spf13/viper"
)

type stores struct {
	pg  *postgres.PostgresStore
	bot *bot.Bot
}

func RegisterRoutes(app *fiber.App, stores *stores) {
	sessionManager := session.New(stores.pg)
	accessManager := access.New(stores.bot)
	premiumManager := premium.New(stores.pg)

	authHandler := auth.New(stores.pg, stores.bot, sessionManager)
	app.Get("/api/auth/login", authHandler.HandleAuthRedirect)
	app.Get("/api/auth/callback", authHandler.HandleAuthCallback)
	app.Get("/api/auth/logout", authHandler.HandleAuthLogout)

	sessionMiddleware := session.NewSessionMiddleware(sessionManager)

	usersHandler := users.New(stores.pg, premiumManager)
	usersGroup := app.Group("/api/users", sessionMiddleware.SessionRequired())
	usersGroup.Get("/:userID", usersHandler.HandleGetUser)

	savedMessagesHandler := saved_messages.New(stores.pg, accessManager)
	savedMessagesGroup := app.Group("/api/saved-messages", sessionMiddleware.SessionRequired())
	savedMessagesGroup.Get("/", savedMessagesHandler.HandleListSavedMessages)
	savedMessagesGroup.Post("/", helpers.WithRequestBodyValidated(savedMessagesHandler.HandleCreateSavedMessage))
	savedMessagesGroup.Patch("/", helpers.WithRequestBodyValidated(savedMessagesHandler.HandleImportSavedMessages))
	savedMessagesGroup.Put("/:messageID", helpers.WithRequestBodyValidated(savedMessagesHandler.HandleUpdateSavedMessage))
	savedMessagesGroup.Delete("/:messageID", savedMessagesHandler.HandleDeleteSavedMessage)

	sharedMessageHandler := shared_messages.New(stores.bot, stores.pg)
	sharedMessagesGroup := app.Group("/api/shared-messages")
	sharedMessagesGroup.Post("/", helpers.WithRequestBodyValidated(sharedMessageHandler.HandleCreateSharedMessage))
	sharedMessagesGroup.Get("/:messageID", sharedMessageHandler.HandleGetSharedMessage)

	assistantHandler := assistant.New(stores.pg, accessManager, premiumManager)
	app.Post("/api/assistant/message", sessionMiddleware.SessionRequired(), helpers.WithRequestBody(assistantHandler.HandleAssistantGenerateMessage))

	guildsHanlder := guilds.New(stores.pg, stores.bot, accessManager, premiumManager)
	guildsGroup := app.Group("/api/guilds", sessionMiddleware.SessionRequired())
	guildsGroup.Get("/", guildsHanlder.HandleListGuilds)
	guildsGroup.Get("/:guildID", guildsHanlder.HandleGetGuild)
	guildsGroup.Get("/:guildID/channels", guildsHanlder.HandleListGuildChannels)
	guildsGroup.Get("/:guildID/roles", guildsHanlder.HandleListGuildRoles)
	guildsGroup.Get("/:guildID/emojis", guildsHanlder.HandleListGuildEmojis)
	guildsGroup.Get("/:guildID/stickers", guildsHanlder.HandleListGuildStickers)

	actionParser := parser.New(accessManager, stores.pg, stores.bot)

	sendMessageHandler := send_message.New(stores.bot, accessManager, actionParser)
	app.Post("/api/send-message/channel", sessionMiddleware.SessionRequired(), helpers.WithRequestBodyValidated(sendMessageHandler.HandleSendMessageToChannel))
	app.Post("/api/send-message/webhook", helpers.WithRequestBodyValidated(sendMessageHandler.HandleSendMessageToWebhook))
	app.Post("/api/restore-message/channel", sessionMiddleware.SessionRequired(), helpers.WithRequestBodyValidated(sendMessageHandler.HandleRestoreMessageFromChannel))
	app.Post("/api/restore-message/webhook", helpers.WithRequestBodyValidated(sendMessageHandler.HandleRestoreMessageFromWebhook))

	premiumHandler := premium_handler.New(stores.pg, stores.bot, accessManager, premiumManager)

	app.Get("/api/premium/features", sessionMiddleware.SessionRequired(), premiumHandler.HandleGetFeatures)
	app.Get("/api/premium/entitlements", sessionMiddleware.SessionRequired(), premiumHandler.HandleListEntitlements)

	customBotHandler := custom_bots.New(stores.pg, stores.bot, accessManager, premiumManager)

	app.Post("/api/custom-bot", sessionMiddleware.SessionRequired(), helpers.WithRequestBodyValidated(customBotHandler.HandleConfigureCustomBot))
	app.Get("/api/custom-bot", sessionMiddleware.SessionRequired(), customBotHandler.HandleGetCustomBot)
	app.Delete("/api/custom-bot", sessionMiddleware.SessionRequired(), customBotHandler.HandleDisableCustomBot)
	app.Post("/api/gateway/:customBotID", customBotHandler.HandleCustomBotInteraction)

	app.Get("/invite", func(c *fiber.Ctx) error {
		return c.Redirect(util.BotInviteURL(), 302)
	})

	app.Get("/discord", func(c *fiber.Ctx) error {
		return c.Redirect(viper.GetString("links.discord"), 302)
	})

	app.Get("/source", func(c *fiber.Ctx) error {
		return c.Redirect(viper.GetString("links.source"), 302)
	})

	app.Get("/premium", func(c *fiber.Ctx) error {
		return c.Redirect(fmt.Sprintf("https://discord.com/application-directory/%s/premium", viper.GetString("discord.client_id")), 302)
	})
}

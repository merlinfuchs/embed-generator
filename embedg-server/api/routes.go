package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/auth"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/guilds"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/magic"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/saved_messages"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/send_message"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers/users"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
)

type stores struct {
	pg  *postgres.PostgresStore
	bot *bot.Bot
}

func RegisterRoutes(app *fiber.App, stores *stores) {
	app.Get("/api", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World 👋!")
	})

	sessionManager := session.New(stores.pg)
	accessManager := access.New(stores.bot)

	authHandler := auth.New(stores.pg, stores.bot, sessionManager)
	app.Get("/api/auth/login", authHandler.HandleAuthRedirect)
	app.Get("/api/auth/callback", authHandler.HandleAuthCallback)
	app.Get("/api/auth/logout", authHandler.HandleAuthLogout)

	sessionMiddleware := session.NewSessionMiddleware(sessionManager)

	usersHandler := users.New(stores.pg)
	usersGroup := app.Group("/api/users", sessionMiddleware.SessionRequired())
	usersGroup.Get("/:userID", usersHandler.HandleGetUser)

	savedMessagesHandler := saved_messages.New(stores.pg, accessManager)
	savedMessagesGroup := app.Group("/api/saved-messages", sessionMiddleware.SessionRequired())
	savedMessagesGroup.Get("/", savedMessagesHandler.HandleListSavedMessages)
	savedMessagesGroup.Post("/", helpers.WithRequestBodyValidated(savedMessagesHandler.HandleCreateSavedMessage))
	savedMessagesGroup.Put("/:messageID", helpers.WithRequestBodyValidated(savedMessagesHandler.HandleUpdateSavedMessage))
	savedMessagesGroup.Delete("/:messageID", savedMessagesHandler.HandleDeleteSavedMessage)

	magicHandler := magic.New()
	app.Post("/api/magic/message", helpers.WithRequestBody(magicHandler.HandleGenerateMagicMessage))

	guildsHanlder := guilds.New(stores.pg, stores.bot, accessManager)
	guildsGroup := app.Group("/api/guilds", sessionMiddleware.SessionRequired())
	guildsGroup.Get("/", guildsHanlder.HandleListGuilds)
	guildsGroup.Get("/:guildID", guildsHanlder.HandleGetGuild)
	guildsGroup.Get("/:guildID/channels", guildsHanlder.HandleListGuildChannels)
	guildsGroup.Get("/:guildID/roles", guildsHanlder.HandleListGuildRoles)
	guildsGroup.Get("/:guildID/emojis", guildsHanlder.HandleListGuildEmojis)
	guildsGroup.Get("/:guildID/stickers", guildsHanlder.HandleListGuildStickers)

	sendMessageHandler := send_message.New(stores.bot, accessManager)
	sendMessageGroup := app.Group("/api/send-message", sessionMiddleware.SessionRequired())
	sendMessageGroup.Post("/channel", helpers.WithRequestBodyValidated(sendMessageHandler.HandleSendMessageToChannel))
	sendMessageGroup.Post("/webhook", helpers.WithRequestBodyValidated(sendMessageHandler.HandleSendMessageToWebhook))
}

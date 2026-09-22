package api

import (
	"bytes"
	"fmt"
	"io/fs"
	"net/http"
	"path"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	embedgapp "github.com/merlinfuchs/embed-generator/embedg-app"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/assistant"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/auth"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/custom_bots"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/embed_links"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/guilds"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/health"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/images"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/interaction"
	premium_handler "github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/premium"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/saved_messages"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/scheduled_messages"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/send_message"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/shared_messages"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers/users"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	embedgsite "github.com/merlinfuchs/embed-generator/embedg-site"
)

func registerRoutes(app *fiber.App, env *Env, config APIConfig) {
	healthHandler := health.New(env.ShardManager)
	healthGroup := app.Group("/api/health")
	healthGroup.Get("/", healthHandler.HandleHealth)
	healthGroup.Get("/shards", healthHandler.HandleShardHealth)

	authHandler := auth.New(auth.AuthHandlerConfig{
		AppPublicURL:    config.AppPublicURL,
		InsecureCookies: config.InsecureCookies,
	}, env.UserStore, env.SessionManager)
	app.Get("/api/auth/login", authHandler.HandleAuthRedirect)
	app.Get("/api/auth/callback", authHandler.HandleAuthCallback)
	app.Post("/api/auth/exchange", handlers.WithRequestBody(authHandler.HandleAuthExchange))
	app.Get("/api/auth/logout", authHandler.HandleAuthLogout)

	sessionMiddleware := session.NewSessionMiddleware(env.SessionManager)

	usersHandler := users.New(env.UserStore, env.PremiumManager)
	usersGroup := app.Group("/api/users", sessionMiddleware.SessionRequired())
	usersGroup.Get("/:userID", usersHandler.HandleGetUser)

	savedMessagesHandler := saved_messages.New(env.SavedMessageStore, env.AccessManager)
	savedMessagesGroup := app.Group("/api/saved-messages", sessionMiddleware.SessionRequired())
	savedMessagesGroup.Get("/", savedMessagesHandler.HandleListSavedMessages)
	savedMessagesGroup.Post("/", handlers.WithRequestBodyValidated(savedMessagesHandler.HandleCreateSavedMessage))
	savedMessagesGroup.Patch("/", handlers.WithRequestBodyValidated(savedMessagesHandler.HandleImportSavedMessages))
	savedMessagesGroup.Put("/:messageID", handlers.WithRequestBodyValidated(savedMessagesHandler.HandleUpdateSavedMessage))
	savedMessagesGroup.Delete("/:messageID", savedMessagesHandler.HandleDeleteSavedMessage)

	sharedMessageHandler := shared_messages.New(shared_messages.SharedMessageHandlerConfig{
		AppPublicURL: config.AppPublicURL,
	}, env.SharedMessageStore)
	sharedMessagesGroup := app.Group("/api/shared-messages")
	sharedMessagesGroup.Post("/", handlers.WithRequestBodyValidated(sharedMessageHandler.HandleCreateSharedMessage))
	sharedMessagesGroup.Get("/:messageID", sharedMessageHandler.HandleGetSharedMessage)

	assistantHandler := assistant.New(env.AccessManager, env.PremiumManager, env.OpenAIClient)
	app.Post("/api/assistant/message", sessionMiddleware.SessionRequired(), handlers.WithRequestBody(assistantHandler.HandleAssistantGenerateMessage))

	guildsHanlder := guilds.New(env.CustomBotStore, env.GuildStore, env.GuildState, env.AccessManager, env.PremiumManager)
	guildsGroup := app.Group("/api/guilds", sessionMiddleware.SessionRequired())
	guildsGroup.Get("/", guildsHanlder.HandleListGuilds)
	guildsGroup.Get("/:guildID", guildsHanlder.HandleGetGuild)
	guildsGroup.Get("/:guildID/channels", guildsHanlder.HandleListGuildChannels)
	guildsGroup.Get("/:guildID/roles", guildsHanlder.HandleListGuildRoles)
	guildsGroup.Get("/:guildID/emojis", guildsHanlder.HandleListGuildEmojis)
	guildsGroup.Get("/:guildID/stickers", guildsHanlder.HandleListGuildStickers)
	guildsGroup.Get("/:guildID/branding", guildsHanlder.HandleGetGuildBranding)

	sendMessageHandler := send_message.New(
		env.Rest,
		env.GuildState,
		env.KVEntryStore,
		env.WebhookManager,
		env.AccessManager,
		env.ActionParser,
		env.PremiumManager,
	)
	app.Post("/api/send-message/channel", sessionMiddleware.SessionRequired(), handlers.WithRequestBodyValidated(sendMessageHandler.HandleSendMessageToChannel))
	app.Post("/api/send-message/webhook", handlers.WithRequestBodyValidated(sendMessageHandler.HandleSendMessageToWebhook))
	app.Post("/api/restore-message/channel", sessionMiddleware.SessionRequired(), handlers.WithRequestBodyValidated(sendMessageHandler.HandleRestoreMessageFromChannel))
	app.Post("/api/restore-message/webhook", handlers.WithRequestBodyValidated(sendMessageHandler.HandleRestoreMessageFromWebhook))

	premiumHandler := premium_handler.New(env.EntitlementStore, env.Rest, env.AccessManager, env.PremiumManager, env.AppContext)
	app.Get("/api/premium/features", sessionMiddleware.SessionRequired(), premiumHandler.HandleGetFeatures)
	app.Get("/api/premium/entitlements", sessionMiddleware.SessionRequired(), premiumHandler.HandleListEntitlements)
	app.Post("/api/premium/entitlements/:entitlementID/consume", sessionMiddleware.SessionRequired(), handlers.WithRequestBodyValidated(premiumHandler.HandleConsumeEntitlement))

	customBotHandler := custom_bots.New(
		custom_bots.CustomBotsHandlerConfig{
			APIPublicURL: config.APIPublicURL,
		},
		env.CustomBotManager,
		env.CustomCommandStore,
		env.GuildState,
		env.AccessManager,
		env.PremiumManager,
		env.ActionParser,
		env.ActionHandler,
	)
	app.Post("/api/custom-bot", sessionMiddleware.SessionRequired(), handlers.WithRequestBodyValidated(customBotHandler.HandleConfigureCustomBot))
	app.Put("/api/custom-bot/presence", sessionMiddleware.SessionRequired(), handlers.WithRequestBodyValidated(customBotHandler.HandleUpdateCustomBotPresence))
	app.Get("/api/custom-bot", sessionMiddleware.SessionRequired(), customBotHandler.HandleGetCustomBot)
	app.Delete("/api/custom-bot", sessionMiddleware.SessionRequired(), customBotHandler.HandleDisableCustomBot)
	app.Get("/api/custom-bot/commands", sessionMiddleware.SessionRequired(), customBotHandler.HandleListCustomCommands)
	app.Get("/api/custom-bot/commands/:commandID", sessionMiddleware.SessionRequired(), customBotHandler.HandleGetCustomCommand)
	app.Post("/api/custom-bot/commands", sessionMiddleware.SessionRequired(), handlers.WithRequestBodyValidated(customBotHandler.HandleCreateCustomCommand))
	app.Put("/api/custom-bot/commands/:commandID", sessionMiddleware.SessionRequired(), handlers.WithRequestBodyValidated(customBotHandler.HandleUpdateCustomCommand))
	app.Delete("/api/custom-bot/commands/:commandID", sessionMiddleware.SessionRequired(), customBotHandler.HandleDeleteCustomCommand)
	app.Post("/api/custom-bot/commands/deploy", sessionMiddleware.SessionRequired(), customBotHandler.HandleDeployCustomCommands)
	app.Post("/api/gateway/:customBotID", customBotHandler.HandleCustomBotInteraction)

	interactionHandler := interaction.New(interaction.InteractionHandlerConfig{
		DiscordPublicKey: config.DiscordPublicKey,
	}, env.EventDispatcher, env.Rest)
	app.Post("/api/gateway", interactionHandler.HandleBotInteraction)

	imagesHandler := images.New(images.ImagesHandlerConfig{
		AppPublicURL: config.AppPublicURL,
		CDNPublicURL: config.CDNPublicURL,
	}, env.ImageStore, env.FileStore, env.AccessManager, env.PremiumManager)
	app.Post("/api/images", sessionMiddleware.SessionRequired(), imagesHandler.HandleUploadImage)
	app.Get("/api/images/:imageID", sessionMiddleware.SessionRequired(), imagesHandler.HandleGetImage)
	app.Get("/cdn/images/:imageKey", imagesHandler.HandleDownloadImage)

	scheduledMessagesHandler := scheduled_messages.New(
		env.ScheduledMessageStore,
		env.AccessManager,
		env.PremiumManager,
	)
	scheduledMessagesGroup := app.Group("/api/scheduled-messages", sessionMiddleware.SessionRequired())
	scheduledMessagesGroup.Get("/", scheduledMessagesHandler.HandleListScheduledMessages)
	scheduledMessagesGroup.Post("/", handlers.WithRequestBodyValidated(scheduledMessagesHandler.HandleCreateScheduledMessage))
	scheduledMessagesGroup.Get("/:messageID", scheduledMessagesHandler.HandleGetScheduledMessage)
	scheduledMessagesGroup.Put("/:messageID", handlers.WithRequestBodyValidated(scheduledMessagesHandler.HandleUpdateScheduledMessage))
	scheduledMessagesGroup.Delete("/:messageID", scheduledMessagesHandler.HandleDeleteScheduledMessage)

	embedLinksHandler := embed_links.New(embed_links.EmbedLinksHandlerConfig{
		APIPublicURL: config.APIPublicURL,
		AppPublicURL: config.AppPublicURL,
	}, env.EmbedLinkStore)
	app.Post("/api/embed-links", handlers.WithRequestBodyValidated(embedLinksHandler.HandleCreateEmbedLink))
	app.Get("/api/embed-links/:linkID/oembed", embedLinksHandler.HandleRenderEmbedLinkJSON)
	app.Get("/e/:linkID", embedLinksHandler.HandleRenderEmbedLinkHTML)

	app.Get("/invite", func(c *fiber.Ctx) error {
		return c.Redirect(env.AppContext.AppInviteURL(), 302)
	})

	app.Get("/discord", func(c *fiber.Ctx) error {
		return c.Redirect(config.DiscordLink, 302)
	})

	app.Get("/source", func(c *fiber.Ctx) error {
		return c.Redirect(config.SourceLink, 302)
	})

	app.Get("/premium", func(c *fiber.Ctx) error {
		return c.Redirect(fmt.Sprintf("https://discord.com/application-directory/%s/premium", env.AppContext.ApplicationID()), 302)
	})

	// Serve static files. Hashed assets are cached long term; index.html points
	// at those hashed names so it has to be revalidated on every load, or a
	// deploy leaves browsers asking for assets that no longer exist.
	registerFrontendRoutes(app, "/app/", embedgapp.DistFS)
	registerFrontendRoutes(app, "/", embedgsite.DistFS)
}

const (
	// Asset file names carry a content hash. fiber's filesystem.Config.MaxAge
	// can't be used for these: it emits max-age but never immutable.
	assetCacheControl = "public, max-age=2592000, immutable"
	// index.html, which must always reflect the deployed asset hashes.
	noCacheControl = "no-cache"
	// Unhashed files that aren't index.html: logos, fonts, docs images. embed.FS
	// reports no ModTime and fiber sets no ETag, so revalidating one costs a full
	// body. A short TTL is cheaper than no-cache and bounds how long a replaced
	// file stays stale.
	staticCacheControl = "public, max-age=3600"
)

// registerFrontendRoutes serves one embedded dist directory. Assets get their
// own mount so that a miss 404s instead of falling through to NotFoundFile,
// which would answer a request for a chunk from an older deploy with index.html
// at 200 and leave the page blank.
func registerFrontendRoutes(app *fiber.App, mount string, dist fs.FS) {
	app.Use(path.Join(mount, "assets"), cacheControl(assetCacheControl), filesystem.New(filesystem.Config{
		Root:       http.FS(dist),
		PathPrefix: "/dist/assets",
	}), func(c *fiber.Ctx) error {
		c.Set(fiber.HeaderCacheControl, noCacheControl)
		return c.SendStatus(fiber.StatusNotFound)
	})

	app.Use(mount, staticCacheHeaders, filesystem.New(filesystem.Config{
		Root:         http.FS(dist),
		NotFoundFile: "dist/index.html",
		PathPrefix:   "/dist",
	}))
}

func cacheControl(value string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set(fiber.HeaderCacheControl, value)
		return c.Next()
	}
}

// staticCacheHeaders revalidates HTML on every load and gives the remaining
// unhashed files a short TTL. Set after the fact because which one applies
// depends on what the file server resolved the request to.
func staticCacheHeaders(c *fiber.Ctx) error {
	if err := c.Next(); err != nil {
		return err
	}
	if c.Response().StatusCode() >= fiber.StatusBadRequest {
		return nil
	}

	if bytes.Contains(c.Response().Header.ContentType(), []byte(fiber.MIMETextHTML)) {
		c.Set(fiber.HeaderCacheControl, noCacheControl)
	} else {
		c.Set(fiber.HeaderCacheControl, staticCacheControl)
	}
	return nil
}

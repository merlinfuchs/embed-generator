package api

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/custom_bot"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/premium"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/webhook"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/rs/zerolog/log"
	"github.com/sashabaranov/go-openai"
)

func Serve(ctx context.Context, env *Env, host string, port int) {
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			var e *wire.Error
			if errors.As(err, &e) {
				return c.Status(e.Status).JSON(e)
			} else {
				slog.Error(
					"Unhandled error in rest endpoint",
					slog.String("method", c.Method()),
					slog.String("path", c.Path()),
					slog.Any("error", err),
				)
				return c.Status(fiber.StatusInternalServerError).JSON(wire.Error{
					Status:  fiber.StatusInternalServerError,
					Code:    "internal_server_error",
					Message: err.Error(),
				})
			}
		},
		BodyLimit: 1024 * 1024 * 32, // 32 MB
	})

	// We don't want the whole app to crash but panics are still very bad
	app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
	}))

	registerRoutes(app, env)

	slog.Info("Starting API server", slog.String("host", host), slog.Int("port", port))

	go func() {
		<-ctx.Done()
		app.Shutdown()
	}()

	err := app.Listen(fmt.Sprintf("%s:%d", host, port))
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}

type Env struct {
	UserStore             store.UserStore
	SharedMessageStore    store.SharedMessageStore
	SavedMessageStore     store.SavedMessageStore
	MessageActionSetStore store.MessageActionSetStore
	ScheduledMessageStore store.ScheduledMessageStore
	CustomBotStore        store.CustomBotStore
	CustomCommandStore    store.CustomCommandStore
	ImageStore            store.ImageStore
	EmbedLinkStore        store.EmbedLinkStore
	CustomBotManager      *custom_bot.CustomBotManager
	KVEntryStore          store.KVEntryStore
	EntitlementStore      store.EntitlementStore
	SessionManager        *session.SessionManager
	PremiumManager        *premium.PremiumManager
	WebhookManager        *webhook.WebhookManager
	AccessManager         *access.AccessManager
	ActionParser          *parser.ActionParser
	ActionHandler         *handler.ActionHandler
	Caches                cache.Caches
	Rest                  rest.Rest
	OpenAIClient          *openai.Client
	FileStore             store.FileStore
	AppContext            store.AppContext
	InteractionDispatcher handler.InteractionDispatcher
}

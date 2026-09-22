package api

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"os"

	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/disgo/sharding"
	"github.com/gofiber/fiber/v2"
	recovermw "github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/custom_bot"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/premium"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/webhook"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/sashabaranov/go-openai"
)

type APIConfig struct {
	Host string
	Port int

	AppPublicURL string
	APIPublicURL string
	CDNPublicURL string

	DiscordLink string
	SourceLink  string

	DiscordPublicKey string
	SupportGuildID   common.ID
	InsecureCookies  bool
}

func Serve(ctx context.Context, env *Env, config APIConfig) {
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) (handlerErr error) {
			// Fiber calls this outside the recover middleware below, so a panic in here takes
			// the process down. err.Error() is the risk: disgo's rest.Error renders Discord's
			// error tree and has panicked on shapes it didn't expect.
			defer func() {
				if r := recover(); r != nil {
					slog.Error(
						"Panic while rendering rest endpoint error",
						slog.String("method", c.Method()),
						slog.String("path", c.Path()),
						slog.Any("panic", r),
					)
					handlerErr = c.Status(fiber.StatusInternalServerError).JSON(wire.Error{
						Status:  fiber.StatusInternalServerError,
						Code:    "internal_server_error",
						Message: "Internal server error",
					})
				}
			}()

			var e *wire.Error
			if errors.As(err, &e) {
				return c.Status(e.Status).JSON(e)
			} else if errors.Is(err, session.ErrSessionInvalid) {
				// Discord no longer accepts the user's token and the session is gone, so this is a
				// re-login, not a server error.
				return c.Status(fiber.StatusUnauthorized).JSON(wire.Error{
					Status:  fiber.StatusUnauthorized,
					Code:    "invalid_session",
					Message: "Your Discord login is no longer valid, try logging in again.",
				})
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
	app.Use(recovermw.New(recovermw.Config{
		EnableStackTrace: true,
	}))

	// Handlers pass this to pgx, minio and oauth2, which all derive cancelable contexts from
	// it. fasthttp's RequestCtx closes Done() without ever setting Err(), which panics the
	// watcher goroutine the context package spawns for a non-stdlib parent. That goroutine is
	// outside the recover above, so it takes the process down.
	//
	// Cancelling when the handler returns keeps derived contexts from piling up under the
	// server context. Nothing that outlives the request may take this context: both
	// interaction handlers answer after three seconds while their goroutine keeps working,
	// so threading this into one of those would cancel the work as the response goes out.
	app.Use(func(c *fiber.Ctx) error {
		reqCtx, cancel := context.WithCancel(ctx)
		defer cancel()

		c.SetUserContext(reqCtx)
		return c.Next()
	})

	registerRoutes(app, env, config)

	slog.Info("Starting API server", slog.String("host", config.Host), slog.Int("port", config.Port))

	go func() {
		<-ctx.Done()
		app.Shutdown()
	}()

	err := app.Listen(fmt.Sprintf("%s:%d", config.Host, config.Port))
	if err != nil {
		slog.Error("Failed to start server", slog.Any("error", err))
		os.Exit(1)
	}
}

type Env struct {
	UserStore             store.UserStore
	SharedMessageStore    store.SharedMessageStore
	SavedMessageStore     store.SavedMessageStore
	MessageActionSetStore store.MessageActionSetStore
	ScheduledMessageStore store.ScheduledMessageStore
	CustomBotStore        store.CustomBotStore
	GuildStore            store.GuildStore
	GuildState            *guildstate.Provider
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
	Rest                  rest.Rest
	ShardManager          sharding.ShardManager
	OpenAIClient          *openai.Client
	FileStore             store.FileStore
	AppContext            store.AppContext
	EventDispatcher       store.EventDispatcher
}

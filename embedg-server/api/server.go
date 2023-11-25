package api

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/fiber/v2/middleware/recover"
	embedgapp "github.com/merlinfuchs/embed-generator/embedg-app"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/s3"
	embedgsite "github.com/merlinfuchs/embed-generator/embedg-site"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

func Serve() {
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			var e *wire.Error
			if errors.As(err, &e) {
				return c.Status(e.Status).JSON(e)
			} else {
				log.Error().Err(err).Msg("Unhandled error in rest endpoint")
				return c.Status(fiber.StatusInternalServerError).JSON(wire.Error{
					Status:  fiber.StatusInternalServerError,
					Code:    "internal_server_error",
					Message: err.Error(),
				})
			}
		},
		BodyLimit: 1024 * 1024 * 32, // 23 MB
	})

	// We don't want the whole app to crash but panics are still very bad
	app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
	}))

	pg := postgres.NewPostgresStore()
	bot, err := bot.New(viper.GetString("discord.token"), pg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize bot")
	}

	blob, err := s3.New()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize blob store")
	}

	RegisterRoutes(app, &stores{
		pg:   pg,
		blob: blob,
		bot:  bot,
	})

	app.Use("/app/", filesystem.New(filesystem.Config{
		Root:         http.FS(embedgapp.DistFS),
		Browse:       false,
		NotFoundFile: "dist/index.html",
		PathPrefix:   "/dist",
	}))

	app.Use("/", filesystem.New(filesystem.Config{
		Root:         http.FS(embedgsite.DistFS),
		Browse:       false,
		NotFoundFile: "dist/index.html",
		PathPrefix:   "/dist",
	}))

	go bot.Start()

	err = app.Listen(fmt.Sprintf("%s:%d", viper.GetString("api.host"), viper.GetInt("api.port")))
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}

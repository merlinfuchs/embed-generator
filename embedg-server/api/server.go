package api

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	embedgapp "github.com/merlinfuchs/embed-generator/embedg-app"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
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
	})

	pg := postgres.NewPostgresStore()
	bot, err := bot.New(viper.GetString("discord.token"), pg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize bot")
	}

	RegisterRoutes(app, &stores{pg, bot})

	if viper.GetBool("app.serve_static") {
		app.Use("/", filesystem.New(filesystem.Config{
			Root:         http.FS(embedgapp.DistFS),
			Browse:       false,
			NotFoundFile: "dist/index.html",
			PathPrefix:   "/dist",
		}))
	}

	go bot.Start()

	app.Listen(fmt.Sprintf("%s:%d", viper.GetString("api.host"), viper.GetInt("api.port")))
}

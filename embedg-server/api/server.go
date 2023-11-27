package api

import (
	"errors"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
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

	stores := createStores()

	bot, err := bot.New(viper.GetString("discord.token"), stores.pg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize bot")
	}

	managers := createManagers(stores, bot)

	registerRoutes(app, stores, bot, managers)

	go bot.Start()

	err = app.Listen(fmt.Sprintf("%s:%d", viper.GetString("api.host"), viper.GetInt("api.port")))
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}

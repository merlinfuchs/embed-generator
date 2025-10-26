package api

import (
	"errors"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/embedg"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

func Serve(embedg *embedg.EmbedGenerator, stores *Stores) {
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
		BodyLimit: 1024 * 1024 * 32, // 32 MB
	})

	// We don't want the whole app to crash but panics are still very bad
	app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
	}))

	managers := createManagers(stores, embedg)

	registerRoutes(app, stores, embedg, managers)

	err := app.Listen(fmt.Sprintf("%s:%d", viper.GetString("api.host"), viper.GetInt("api.port")))
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}

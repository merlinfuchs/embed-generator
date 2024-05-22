package shared_messages

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

type SharedMessageHandler struct {
	bot *bot.Bot
	pg  *postgres.PostgresStore
}

func New(bot *bot.Bot, pg *postgres.PostgresStore) *SharedMessageHandler {
	return &SharedMessageHandler{
		bot: bot,
		pg:  pg,
	}
}

func (h *SharedMessageHandler) HandleCreateSharedMessage(c *fiber.Ctx, req wire.SharedMessageCreateRequestWire) error {
	msg, err := h.pg.Q.InsertSharedMessage(c.Context(), pgmodel.InsertSharedMessageParams{
		ID:        util.UniqueID(),
		CreatedAt: time.Now().UTC(),
		ExpiresAt: time.Now().UTC().Add(time.Hour * 24 * 7),
		Data:      req.Data,
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to create shared message")
		return err
	}

	err = h.pg.Q.DeleteExpiredSharedMessages(c.Context(), time.Now().UTC())
	if err != nil {
		log.Error().Err(err).Msg("Failed to delete expired shared messages")
	}

	return c.JSON(wire.SharedMessageCreateResponseWire{
		Success: true,
		Data: wire.SharedMessageWire{
			ID:        msg.ID,
			CreatedAt: msg.CreatedAt,
			ExpiresAt: msg.ExpiresAt,
			Data:      msg.Data,
			URL:       fmt.Sprintf("%s/editor/share/%s", viper.GetString("app.public_url"), msg.ID),
		},
	})
}

func (h *SharedMessageHandler) HandleGetSharedMessage(c *fiber.Ctx) error {
	messageID := c.Params("messageID")

	msg, err := h.pg.Q.GetSharedMessage(c.Context(), messageID)
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("unknown_message", "The shared message does not exist or has expired.")
		}
		log.Error().Err(err).Msg("Failed to get shared message")
		return err
	}

	return c.JSON(wire.SharedMessageGetResponseWire{
		Success: true,
		Data: wire.SharedMessageWire{
			ID:        msg.ID,
			CreatedAt: msg.CreatedAt,
			ExpiresAt: msg.ExpiresAt,
			Data:      msg.Data,
			URL:       fmt.Sprintf("%s/editor/share/%s", viper.GetString("app.public_url"), msg.ID),
		},
	})
}

package shared_messages

import (
	"errors"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

type SharedMessageHandler struct {
	sharedMessageStore store.SharedMessageStore
}

func New(sharedMessageStore store.SharedMessageStore) *SharedMessageHandler {
	return &SharedMessageHandler{
		sharedMessageStore: sharedMessageStore,
	}
}

func (h *SharedMessageHandler) HandleCreateSharedMessage(c *fiber.Ctx, req wire.SharedMessageCreateRequestWire) error {
	msg, err := h.sharedMessageStore.CreateSharedMessage(c.Context(), model.SharedMessage{
		ID:        common.UniqueID().String(),
		CreatedAt: time.Now().UTC(),
		ExpiresAt: time.Now().UTC().Add(time.Hour * 24 * 7),
		Data:      req.Data,
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to create shared message")
		return err
	}

	err = h.sharedMessageStore.DeleteExpiredSharedMessages(c.Context(), time.Now().UTC())
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

	msg, err := h.sharedMessageStore.GetSharedMessage(c.Context(), messageID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("unknown_message", "The shared message does not exist or has expired.")
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

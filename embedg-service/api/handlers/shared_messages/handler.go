package shared_messages

import (
	"errors"
	"fmt"
	"time"

	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

type SharedMessageHandlerConfig struct {
	AppPublicURL string
}

type SharedMessageHandler struct {
	config             SharedMessageHandlerConfig
	sharedMessageStore store.SharedMessageStore
}

func New(config SharedMessageHandlerConfig, sharedMessageStore store.SharedMessageStore) *SharedMessageHandler {
	return &SharedMessageHandler{
		config:             config,
		sharedMessageStore: sharedMessageStore,
	}
}

func (h *SharedMessageHandler) HandleCreateSharedMessage(c *fiber.Ctx, req wire.SharedMessageCreateRequestWire) error {
	msg, err := h.sharedMessageStore.CreateSharedMessage(c.Context(), model.SharedMessage{
		ID:        common.InternalID(),
		CreatedAt: time.Now().UTC(),
		ExpiresAt: time.Now().UTC().Add(time.Hour * 24 * 7),
		Data:      req.Data,
	})
	if err != nil {
		slog.Error("Failed to create shared message", slog.Any("error", err))
		return err
	}

	err = h.sharedMessageStore.DeleteExpiredSharedMessages(c.Context(), time.Now().UTC())
	if err != nil {
		slog.Error("Failed to delete expired shared messages", slog.Any("error", err))
	}

	return c.JSON(wire.SharedMessageCreateResponseWire{
		Success: true,
		Data: wire.SharedMessageWire{
			ID:        msg.ID,
			CreatedAt: msg.CreatedAt,
			ExpiresAt: msg.ExpiresAt,
			Data:      msg.Data,
			URL:       fmt.Sprintf("%s/editor/share/%s", h.config.AppPublicURL, msg.ID),
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
		slog.Error("Failed to get shared message", slog.Any("error", err))
		return err
	}

	return c.JSON(wire.SharedMessageGetResponseWire{
		Success: true,
		Data: wire.SharedMessageWire{
			ID:        msg.ID,
			CreatedAt: msg.CreatedAt,
			ExpiresAt: msg.ExpiresAt,
			Data:      msg.Data,
			URL:       fmt.Sprintf("%s/editor/share/%s", h.config.AppPublicURL, msg.ID),
		},
	})
}

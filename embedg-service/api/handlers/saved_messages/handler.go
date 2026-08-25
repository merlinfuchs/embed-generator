package saved_messages

import (
	"errors"
	"time"

	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

type SavedMessagesHandler struct {
	savedMessageStore store.SavedMessageStore
	am                *access.AccessManager
}

func New(savedMessageStore store.SavedMessageStore, am *access.AccessManager) *SavedMessagesHandler {
	return &SavedMessagesHandler{
		savedMessageStore: savedMessageStore,
		am:                am,
	}
}

func (h *SavedMessagesHandler) HandleListSavedMessages(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)

	guildID, err := handlers.QueryNullID(c, "guild_id")
	if err != nil {
		return err
	}

	var messages []model.SavedMessage

	if guildID.Valid {
		if err := h.am.CheckGuildAccessForRequest(c, guildID.ID); err != nil {
			return err
		}
		messages, err = h.savedMessageStore.GetSavedMessagesForGuild(c.Context(), guildID.ID)
	} else {
		messages, err = h.savedMessageStore.GetSavedMessagesForCreator(c.Context(), session.UserID)
	}

	if err != nil {
		slog.Error("Failed to get saved messages", slog.Any("error", err))
		return err
	}

	res := make([]wire.SavedMessageWire, len(messages))
	for i, message := range messages {
		res[i] = savedMessageModelToWire(&message)
	}

	return c.JSON(wire.SavedMessageListResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *SavedMessagesHandler) HandleCreateSavedMessage(c *fiber.Ctx, req wire.SavedMessageCreateRequestWire) error {
	session := c.Locals("session").(*session.Session)
	guildID, err := handlers.QueryNullID(c, "guild_id")
	if err != nil {
		return err
	}

	if guildID.Valid {
		if err := h.am.CheckGuildAccessForRequest(c, guildID.ID); err != nil {
			return err
		}
	}

	message, err := h.savedMessageStore.CreateSavedMessage(c.Context(), model.SavedMessage{
		ID:          common.InternalID(),
		CreatorID:   session.UserID,
		GuildID:     guildID,
		UpdatedAt:   time.Now().UTC(),
		Name:        req.Name,
		Description: req.Description,
		Data:        req.Data,
	})
	if err != nil {
		slog.Error("Failed to create saved message", slog.Any("error", err))
		return err
	}

	return c.JSON(wire.SavedMessageCreateResponseWire{
		Success: true,
		Data:    savedMessageModelToWire(message),
	})
}

func (h *SavedMessagesHandler) HandleUpdateSavedMessage(c *fiber.Ctx, req wire.SavedMessageUpdateRequestWire) error {
	session := c.Locals("session").(*session.Session)
	messageID := c.Params("messageID")
	guildID, err := handlers.QueryNullID(c, "guild_id")
	if err != nil {
		return err
	}

	if guildID.Valid {
		if err := h.am.CheckGuildAccessForRequest(c, guildID.ID); err != nil {
			return err
		}
	}

	var message *model.SavedMessage
	if guildID.Valid {
		message, err = h.savedMessageStore.UpdateSavedMessageForGuild(c.Context(), model.SavedMessage{
			ID:          messageID,
			GuildID:     guildID,
			UpdatedAt:   time.Now().UTC(),
			Name:        req.Name,
			Description: req.Description,
			Data:        req.Data,
		})
	} else {
		message, err = h.savedMessageStore.UpdateSavedMessageForCreator(c.Context(), model.SavedMessage{
			ID:          messageID,
			CreatorID:   session.UserID,
			UpdatedAt:   time.Now().UTC(),
			Name:        req.Name,
			Description: req.Description,
			Data:        req.Data,
		})
	}

	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("unknown_message", "The message does not exist.")
		}
		slog.Error("Failed to update saved message", slog.Any("error", err))
		return err
	}

	return c.JSON(wire.SavedMessageUpdateResponseWire{
		Success: true,
		Data:    savedMessageModelToWire(message),
	})
}

func (h *SavedMessagesHandler) HandleDeleteSavedMessage(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	messageID := c.Params("messageID")
	guildID, err := handlers.QueryNullID(c, "guild_id")
	if err != nil {
		return err
	}

	if guildID.Valid {
		if err := h.am.CheckGuildAccessForRequest(c, guildID.ID); err != nil {
			return err
		}
	}

	if guildID.Valid {
		err = h.savedMessageStore.DeleteSavedMessageForGuild(c.Context(), guildID.ID, messageID)
	} else {
		err = h.savedMessageStore.DeleteSavedMessageForCreator(c.Context(), session.UserID, messageID)
	}

	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("unknown_message", "The message does not exist.")
		}
		slog.Error("Failed to delete saved message", slog.Any("error", err))
		return err
	}

	return c.JSON(wire.SavedMessageDeleteResponseWire{
		Success: true,
		Data:    struct{}{},
	})
}

func (h *SavedMessagesHandler) HandleImportSavedMessages(c *fiber.Ctx, req wire.SavedMessagesImportRequestWire) error {
	session := c.Locals("session").(*session.Session)
	guildID, err := handlers.QueryNullID(c, "guild_id")
	if err != nil {
		return err
	}

	if guildID.Valid {
		if err := h.am.CheckGuildAccessForRequest(c, guildID.ID); err != nil {
			return err
		}
	}

	res := make([]wire.SavedMessageWire, len(req.Messages))

	for i, msg := range req.Messages {
		message, err := h.savedMessageStore.CreateSavedMessage(c.Context(), model.SavedMessage{
			ID:          common.InternalID(),
			CreatorID:   session.UserID,
			GuildID:     guildID,
			UpdatedAt:   time.Now().UTC(),
			Name:        msg.Name,
			Description: msg.Description,
			Data:        msg.Data,
		})
		if err != nil {
			slog.Error("Failed to create saved message", slog.Any("error", err))
			return err
		}
		res[i] = savedMessageModelToWire(message)
	}

	return c.JSON(wire.SavedMessagesImportResponseWire{
		Success: true,
		Data:    res,
	})
}

func savedMessageModelToWire(model *model.SavedMessage) wire.SavedMessageWire {
	return wire.SavedMessageWire{
		ID:          model.ID,
		CreatorID:   model.CreatorID,
		GuildID:     model.GuildID,
		UpdatedAt:   model.UpdatedAt,
		Name:        model.Name,
		Description: model.Description,
		Data:        model.Data,
	}
}

package saved_messages

import (
	"errors"
	"time"

	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

type SavedMessagesHandler struct {
	savedMessageStore store.SavedMessageStore
	am                *access.AccessManager
	planStore         store.PlanStore
}

func New(savedMessageStore store.SavedMessageStore, am *access.AccessManager, planStore store.PlanStore) *SavedMessagesHandler {
	return &SavedMessagesHandler{
		savedMessageStore: savedMessageStore,
		am:                am,
		planStore:         planStore,
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
		messages, err = h.savedMessageStore.GetSavedMessagesForGuild(c.UserContext(), guildID.ID)
	} else {
		messages, err = h.savedMessageStore.GetSavedMessagesForCreator(c.UserContext(), session.UserID)
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

	if err := h.checkSavedMessageLimit(c, session.UserID, guildID, 1); err != nil {
		return err
	}

	message, err := h.savedMessageStore.CreateSavedMessage(c.UserContext(), model.SavedMessage{
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
		message, err = h.savedMessageStore.UpdateSavedMessageForGuild(c.UserContext(), model.SavedMessage{
			ID:          messageID,
			GuildID:     guildID,
			UpdatedAt:   time.Now().UTC(),
			Name:        req.Name,
			Description: req.Description,
			Data:        req.Data,
		})
	} else {
		message, err = h.savedMessageStore.UpdateSavedMessageForCreator(c.UserContext(), model.SavedMessage{
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
		err = h.savedMessageStore.DeleteSavedMessageForGuild(c.UserContext(), guildID.ID, messageID)
	} else {
		err = h.savedMessageStore.DeleteSavedMessageForCreator(c.UserContext(), session.UserID, messageID)
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

	if err := h.checkSavedMessageLimit(c, session.UserID, guildID, len(req.Messages)); err != nil {
		return err
	}

	res := make([]wire.SavedMessageWire, len(req.Messages))

	for i, msg := range req.Messages {
		message, err := h.savedMessageStore.CreateSavedMessage(c.UserContext(), model.SavedMessage{
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

// checkSavedMessageLimit checks that adding messages stays within the plan of the guild, or of the
// user for their personal messages.
func (h *SavedMessagesHandler) checkSavedMessageLimit(c *fiber.Ctx, userID common.ID, guildID common.NullID, adding int) error {
	var features model.PlanFeatures
	var count int64
	var err error
	if guildID.Valid {
		features, err = h.planStore.GetPlanFeaturesForGuild(c.UserContext(), guildID.ID)
		if err != nil {
			return err
		}
		count, err = h.savedMessageStore.CountSavedMessagesForGuild(c.UserContext(), guildID.ID)
	} else {
		features, err = h.planStore.GetPlanFeaturesForUser(c.UserContext(), userID)
		if err != nil {
			return err
		}
		count, err = h.savedMessageStore.CountSavedMessagesForCreator(c.UserContext(), userID)
	}
	if err != nil {
		return err
	}

	if int(count)+adding > features.MaxSavedMessages {
		return handlers.Forbidden("insufficient_plan", "You have reached the maximum number of saved messages for your plan!")
	}

	return nil
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

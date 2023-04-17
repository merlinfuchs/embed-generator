package saved_messages

import (
	"database/sql"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"gopkg.in/guregu/null.v4"
)

type SavedMessagesHandler struct {
	pg *postgres.PostgresStore
	am *access.AccessManager
}

func New(pg *postgres.PostgresStore, am *access.AccessManager) *SavedMessagesHandler {
	return &SavedMessagesHandler{
		pg: pg,
		am: am,
	}
}

func (h *SavedMessagesHandler) HandleListSavedMessages(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	ownerID := c.Query("guild_id")
	if ownerID != "" {
		if err := h.am.CheckGuildAccessForRequest(c, ownerID); err != nil {
			return err
		}
	}

	if ownerID == "" {
		ownerID = session.UserID
	}

	messages, err := h.pg.Q.GetSavedMessages(c.Context(), ownerID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get saved messages")
		return err
	}

	res := make([]wire.SavedMessageWire, len(messages))
	for i, message := range messages {
		res[i] = savedMessageModelToWire(message)
	}

	return c.JSON(wire.SavedMessageListResponseWire(res))
}

func (h *SavedMessagesHandler) HandleGetSavedMessage(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	messageID := c.Params("messageID")

	message, err := h.pg.Q.GetSavedMessage(c.Context(), postgres.GetSavedMessageParams{
		ID:      messageID,
		OwnerID: session.UserID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("unknown_message", "The message does not exist.")
		}
		log.Error().Err(err).Msg("Failed to get saved message")
		return err
	}

	return c.JSON(wire.SavedMessageGetResponseWire(savedMessageModelToWire(message)))
}

func (h *SavedMessagesHandler) HandleCreateSavedMessage(c *fiber.Ctx, req wire.SavedMessageCreateRequestWire) error {
	session := c.Locals("session").(*session.Session)

	message, err := h.pg.Q.InsertSavedMessage(c.Context(), postgres.InsertSavedMessageParams{
		ID:          util.UniqueID(),
		OwnerID:     session.UserID,
		UpdatedAt:   time.Now().UTC(),
		Name:        req.Name,
		Description: sql.NullString{String: req.Description.String, Valid: req.Description.Valid},
		Data:        req.Data,
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to create saved message")
		return err
	}

	return c.JSON(wire.SavedMessageCreateResponseWire(savedMessageModelToWire(message)))
}

func (h *SavedMessagesHandler) HandleUpdateSavedMessage(c *fiber.Ctx, req wire.SavedMessageUpdateRequestWire) error {
	session := c.Locals("session").(*session.Session)
	messageID := c.Params("messageID")

	message, err := h.pg.Q.UpdateSavedMessage(c.Context(), postgres.UpdateSavedMessageParams{
		ID:          messageID,
		OwnerID:     session.UserID,
		UpdatedAt:   time.Now().UTC(),
		Name:        req.Name,
		Description: sql.NullString{String: req.Description.String, Valid: req.Description.Valid},
		Data:        req.Data,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("unknown_message", "The message does not exist.")
		}
		log.Error().Err(err).Msg("Failed to update saved message")
		return err
	}

	return c.JSON(wire.SavedMessageUpdateResponseWire(savedMessageModelToWire(message)))
}

func (h *SavedMessagesHandler) HandleDeleteSavedMessage(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	messageID := c.Params("messageID")

	err := h.pg.Q.DeleteSavedMessage(c.Context(), postgres.DeleteSavedMessageParams{
		ID:      messageID,
		OwnerID: session.UserID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("unknown_message", "The message does not exist.")
		}
		log.Error().Err(err).Msg("Failed to delete saved message")
		return err
	}

	return c.JSON(wire.SavedMessageDeleteResponseWire{})
}

func savedMessageModelToWire(model postgres.SavedMessage) wire.SavedMessageWire {
	return wire.SavedMessageWire{
		ID:          model.ID,
		OwnerID:     model.OwnerID,
		UpdatedAt:   model.UpdatedAt,
		Name:        model.Name,
		Description: null.NewString(model.Description.String, model.Description.Valid),
		Data:        model.Data,
	}
}

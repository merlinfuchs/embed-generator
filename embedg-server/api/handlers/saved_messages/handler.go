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

	guildID := c.Query("guild_id")

	var messages []postgres.SavedMessage
	var err error

	if guildID != "" {
		if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
			return err
		}
		messages, err = h.pg.Q.GetSavedMessagesForGuild(c.Context(), sql.NullString{String: guildID, Valid: true})
	} else {
		messages, err = h.pg.Q.GetSavedMessagesForCreator(c.Context(), session.UserID)
	}

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

func (h *SavedMessagesHandler) HandleCreateSavedMessage(c *fiber.Ctx, req wire.SavedMessageCreateRequestWire) error {
	session := c.Locals("session").(*session.Session)
	guildID := c.Query("guild_id")

	if guildID != "" {
		if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
			return err
		}
	}

	message, err := h.pg.Q.InsertSavedMessage(c.Context(), postgres.InsertSavedMessageParams{
		ID:          util.UniqueID(),
		CreatorID:   session.UserID,
		GuildID:     sql.NullString{String: guildID, Valid: guildID != ""},
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
	guildID := c.Query("guild_id")

	if guildID != "" {
		if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
			return err
		}
	}

	var message postgres.SavedMessage
	var err error
	if guildID != "" {
		message, err = h.pg.Q.UpdateSavedMessageForGuild(c.Context(), postgres.UpdateSavedMessageForGuildParams{
			ID:          messageID,
			GuildID:     sql.NullString{String: guildID, Valid: true},
			UpdatedAt:   time.Now().UTC(),
			Name:        req.Name,
			Description: sql.NullString{String: req.Description.String, Valid: req.Description.Valid},
			Data:        req.Data,
		})
	} else {
		message, err = h.pg.Q.UpdateSavedMessageForCreator(c.Context(), postgres.UpdateSavedMessageForCreatorParams{
			ID:          messageID,
			CreatorID:   session.UserID,
			UpdatedAt:   time.Now().UTC(),
			Name:        req.Name,
			Description: sql.NullString{String: req.Description.String, Valid: req.Description.Valid},
			Data:        req.Data,
		})
	}

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
	guildID := c.Query("guild_id")

	if guildID != "" {
		if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
			return err
		}
	}

	var err error
	if guildID != "" {
		err = h.pg.Q.DeleteSavedMessageForGuild(c.Context(), postgres.DeleteSavedMessageForGuildParams{
			ID:      messageID,
			GuildID: sql.NullString{String: guildID, Valid: true},
		})
	} else {
		err = h.pg.Q.DeleteSavedMessageForCreator(c.Context(), postgres.DeleteSavedMessageForCreatorParams{
			ID:        messageID,
			CreatorID: session.UserID,
		})
	}

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
		CreatorID:   model.CreatorID,
		GuildID:     null.NewString(model.GuildID.String, model.GuildID.Valid),
		UpdatedAt:   model.UpdatedAt,
		Name:        model.Name,
		Description: null.NewString(model.Description.String, model.Description.Valid),
		Data:        model.Data,
	}
}

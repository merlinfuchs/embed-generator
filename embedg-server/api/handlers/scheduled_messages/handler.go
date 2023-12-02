package scheduled_messages

import (
	"database/sql"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/scheduled_messages"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"gopkg.in/guregu/null.v4"
)

type ScheduledMessageHandler struct {
	pg *postgres.PostgresStore
	am *access.AccessManager
}

func New(pg *postgres.PostgresStore, am *access.AccessManager) *ScheduledMessageHandler {
	return &ScheduledMessageHandler{
		pg: pg,
		am: am,
	}
}

func (h *ScheduledMessageHandler) HandleCreateScheduledMessage(c *fiber.Ctx, req wire.ScheduledMessageCreateRequestWire) error {
	session := c.Locals("session").(*session.Session)
	guildID := c.Params("guild_id")

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	nextAt := req.StartAt
	if req.CronExpression.Valid {
		schedule, err := scheduled_messages.ParseCronExpression(req.CronExpression.String)
		if err != nil {
			return helpers.BadRequest("invalid_cron_expression", "The cron expression is invalid.")
		}

		nextAt = schedule.Next(req.StartAt)
		if schedule.Next(nextAt).Sub(nextAt) < time.Minute {
			return helpers.BadRequest("invalid_cron_expression", "The cron expression is too tight and will trigger too often.")
		}
	}

	msg, err := h.pg.Q.InsertScheduledMessage(c.Context(), postgres.InsertScheduledMessageParams{
		ID:        util.UniqueID(),
		CreatorID: session.UserID,
		GuildID:   guildID,
		ChannelID: req.ChannelID,
		MessageID: sql.NullString{
			String: req.MessageID.String,
			Valid:  req.MessageID.Valid,
		},
		SavedMessageID: req.SavedMessageID,
		CronExpression: sql.NullString{
			String: req.CronExpression.String,
			Valid:  req.CronExpression.Valid,
		},
		StartAt: req.StartAt,
		EndAt: sql.NullTime{
			Time:  req.EndAt.Time,
			Valid: req.EndAt.Valid,
		},
		NextAt:    nextAt,
		OnlyOnce:  req.OnlyOnce,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to create scheduled message")
		return err
	}

	return c.JSON(wire.ScheduledMessageCreateResponseWire{
		Success: true,
		Data:    scheduledMessageModelToWire(msg),
	})
}

func (h *ScheduledMessageHandler) HandleListScheduledMessages(c *fiber.Ctx) error {
	guildID := c.Query("guild_id")

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	messages, err := h.pg.Q.GetScheduledMessages(c.Context(), guildID)

	if err != nil {
		log.Error().Err(err).Msg("Failed to get scheduled messages")
		return err
	}

	res := make([]wire.ScheduledMessageWire, len(messages))
	for i, message := range messages {
		res[i] = scheduledMessageModelToWire(message)
	}

	return c.JSON(wire.ScheduledMessageListResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *ScheduledMessageHandler) HandleGetScheduledMessage(c *fiber.Ctx) error {
	messageID := c.Params("messageID")
	guildID := c.Params("guild_id")

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	msg, err := h.pg.Q.GetScheduledMessage(c.Context(), postgres.GetScheduledMessageParams{
		ID:      messageID,
		GuildID: guildID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("unknown_message", "The scheduled message does not exist or has expired.")
		}
		log.Error().Err(err).Msg("Failed to get scheduled message")
		return err
	}

	return c.JSON(wire.ScheduledMessageGetResponseWire{
		Success: true,
		Data:    scheduledMessageModelToWire(msg),
	})
}

func (h *ScheduledMessageHandler) HandleUpdateScheduledMessage(c *fiber.Ctx, req wire.ScheduledMessageUpdateRequestWire) error {
	messageID := c.Params("messageID")
	guildID := c.Query("guild_id")

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	nextAt := req.StartAt
	if req.CronExpression.Valid {
		schedule, err := scheduled_messages.ParseCronExpression(req.CronExpression.String)
		if err != nil {
			return helpers.BadRequest("invalid_cron_expression", "The cron expression is invalid.")
		}

		nextAt = schedule.Next(req.StartAt)
		if schedule.Next(nextAt).Sub(nextAt) < time.Minute {
			return helpers.BadRequest("invalid_cron_expression", "The cron expression is too tight and will trigger too often.")
		}
	}

	msg, err := h.pg.Q.UpdateScheduledMessage(c.Context(), postgres.UpdateScheduledMessageParams{
		ID:        messageID,
		GuildID:   guildID,
		ChannelID: req.ChannelID,
		MessageID: sql.NullString{
			String: req.MessageID.String,
			Valid:  req.MessageID.Valid,
		},
		SavedMessageID: req.SavedMessageID,
		CronExpression: sql.NullString{
			String: req.CronExpression.String,
			Valid:  req.CronExpression.Valid,
		},
		StartAt: req.StartAt,
		EndAt: sql.NullTime{
			Time:  req.EndAt.Time,
			Valid: req.EndAt.Valid,
		},
		NextAt:    nextAt,
		OnlyOnce:  req.OnlyOnce,
		Enabled:   req.Enabled,
		UpdatedAt: time.Now().UTC(),
	})

	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("unknown_message", "The scheduled message does not exist.")
		}
		log.Error().Err(err).Msg("Failed to update scheduled message")
		return err
	}

	return c.JSON(wire.ScheduledMessageUpdateResponseWire{
		Success: true,
		Data:    scheduledMessageModelToWire(msg),
	})
}

func (h *ScheduledMessageHandler) HandleDeleteScheduledMessage(c *fiber.Ctx) error {
	messageID := c.Params("messageID")
	guildID := c.Query("guild_id")

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	err := h.pg.Q.DeleteScheduledMessage(c.Context(), postgres.DeleteScheduledMessageParams{
		ID:      messageID,
		GuildID: guildID,
	})

	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("unknown_message", "The scheduled message does not exist.")
		}
		log.Error().Err(err).Msg("Failed to delete scheduled message")
		return err
	}

	return c.JSON(wire.ScheduledMessageDeleteResponseWire{
		Success: true,
		Data:    struct{}{},
	})
}

func scheduledMessageModelToWire(model postgres.ScheduledMessage) wire.ScheduledMessageWire {
	return wire.ScheduledMessageWire{
		ID:             model.ID,
		CreatorID:      model.CreatorID,
		GuildID:        model.GuildID,
		ChannelID:      model.ChannelID,
		MessageID:      null.NewString(model.MessageID.String, model.MessageID.Valid),
		SavedMessageID: model.SavedMessageID,
		CronExpression: null.NewString(model.CronExpression.String, model.CronExpression.Valid),
		StartAt:        model.StartAt,
		EndAt:          null.NewTime(model.EndAt.Time, model.EndAt.Valid),
		NextAt:         model.NextAt,
		OnlyOnce:       model.OnlyOnce,
		Enabled:        model.Enabled,
		CreatedAt:      model.CreatedAt,
		UpdatedAt:      model.UpdatedAt,
	}
}

package scheduled_messages

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	scheduled_messages "github.com/merlinfuchs/embed-generator/embedg-service/manager/scheduled_message"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/rs/zerolog/log"
)

type ScheduledMessageHandler struct {
	scheduledMessageStore store.ScheduledMessageStore
	am                    *access.AccessManager
	planStore             store.PlanStore
}

func New(scheduledMessageStore store.ScheduledMessageStore, am *access.AccessManager, planStore store.PlanStore) *ScheduledMessageHandler {
	return &ScheduledMessageHandler{
		scheduledMessageStore: scheduledMessageStore,
		am:                    am,
		planStore:             planStore,
	}
}

func (h *ScheduledMessageHandler) HandleCreateScheduledMessage(c *fiber.Ctx, req wire.ScheduledMessageCreateRequestWire) error {
	session := c.Locals("session").(*session.Session)
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	if err := h.am.CheckChannelAccessForRequest(c, req.ChannelID); err != nil {
		return err
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.Context(), guildID)
	if err != nil {
		return err
	}

	if !req.OnlyOnce && !features.PeriodicScheduledMessages {
		return helpers.Forbidden("insufficient_plan", "Periodic scheduled messages are not available on your plan.")
	}

	// TODO: validate max scheduled messages

	if req.EndAt.Valid && req.EndAt.Time.Before(req.StartAt) {
		return helpers.BadRequest("invalid_end_at", "The end_at field must be after the start_at field.")
	}

	if req.StartAt.Before(time.Now().UTC()) {
		req.StartAt = time.Now().UTC()
	}

	nextAt := req.StartAt
	if !req.OnlyOnce {
		var err error
		nextAt, err = scheduled_messages.GetFirstCronTick(req.CronExpression.String, req.StartAt, req.CronTimezone.String)
		if err != nil {
			return helpers.BadRequest("invalid_cron_expression", "The cron expression is invalid.")
		}

		nextNextAt, err := scheduled_messages.GetNextCronTick(req.CronExpression.String, nextAt, req.CronTimezone.String)
		if err != nil {
			return helpers.BadRequest("invalid_cron_expression", "The cron expression is invalid.")
		}

		if nextNextAt.Sub(nextAt) < time.Minute {
			return helpers.BadRequest("invalid_cron_expression", "The cron expression is too tight and will trigger too often.")
		}
	}

	msg, err := h.scheduledMessageStore.CreateScheduledMessage(c.Context(), model.ScheduledMessage{
		ID:             common.UniqueID().String(),
		CreatorID:      session.UserID,
		GuildID:        guildID,
		ChannelID:      req.ChannelID,
		MessageID:      req.MessageID,
		ThreadName:     req.ThreadName,
		SavedMessageID: req.SavedMessageID,
		Name:           req.Name,
		Description:    req.Description,
		CronExpression: req.CronExpression,
		CronTimezone:   req.CronTimezone,
		StartAt:        req.StartAt,
		EndAt:          req.EndAt,
		NextAt:         nextAt,
		OnlyOnce:       req.OnlyOnce,
		CreatedAt:      time.Now().UTC(),
		UpdatedAt:      time.Now().UTC(),
		Enabled:        req.Enabled,
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
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	messages, err := h.scheduledMessageStore.GetScheduledMessages(c.Context(), guildID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get scheduled messages")
		return err
	}

	res := make([]wire.ScheduledMessageWire, len(messages))
	for i, message := range messages {
		res[i] = scheduledMessageModelToWire(&message)
	}

	return c.JSON(wire.ScheduledMessageListResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *ScheduledMessageHandler) HandleGetScheduledMessage(c *fiber.Ctx) error {
	messageID := c.Params("messageID")
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	msg, err := h.scheduledMessageStore.GetScheduledMessage(c.Context(), guildID, messageID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
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
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	if err := h.am.CheckChannelAccessForRequest(c, req.ChannelID); err != nil {
		return err
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.Context(), guildID)
	if err != nil {
		return err
	}

	if !req.OnlyOnce && !features.PeriodicScheduledMessages {
		return helpers.Forbidden("insufficient_plan", "Periodic scheduled messages are not available on your plan.")
	}

	if req.EndAt.Valid && req.EndAt.Time.Before(req.StartAt) {
		return helpers.BadRequest("invalid_end_at", "The end_at field must be after the start_at field.")
	}

	if req.StartAt.Before(time.Now().UTC()) {
		req.StartAt = time.Now().UTC()
	}

	nextAt := req.StartAt
	if !req.OnlyOnce {
		var err error
		nextAt, err = scheduled_messages.GetFirstCronTick(req.CronExpression.String, req.StartAt, req.CronTimezone.String)
		if err != nil {
			return helpers.BadRequest("invalid_cron_expression", "The cron expression is invalid.")
		}

		nextNextAt, err := scheduled_messages.GetNextCronTick(req.CronExpression.String, nextAt, req.CronTimezone.String)
		if err != nil {
			return helpers.BadRequest("invalid_cron_expression", "The cron expression is invalid.")
		}

		if nextNextAt.Sub(nextAt) < time.Minute {
			return helpers.BadRequest("invalid_cron_expression", "The cron expression is too tight and will trigger too often.")
		}
	}

	msg, err := h.scheduledMessageStore.UpdateScheduledMessage(c.Context(), model.ScheduledMessage{
		ID:             messageID,
		GuildID:        guildID,
		ChannelID:      req.ChannelID,
		MessageID:      req.MessageID,
		ThreadName:     req.ThreadName,
		SavedMessageID: req.SavedMessageID,
		Name:           req.Name,
		Description:    req.Description,
		CronExpression: req.CronExpression,
		CronTimezone:   req.CronTimezone,
		StartAt:        req.StartAt,
		EndAt:          req.EndAt,
		NextAt:         nextAt,
		OnlyOnce:       req.OnlyOnce,
		Enabled:        req.Enabled,
		UpdatedAt:      time.Now().UTC(),
	})

	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
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
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	err = h.scheduledMessageStore.DeleteScheduledMessage(c.Context(), guildID, messageID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
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

func scheduledMessageModelToWire(model *model.ScheduledMessage) wire.ScheduledMessageWire {
	return wire.ScheduledMessageWire{
		ID:             model.ID,
		CreatorID:      model.CreatorID,
		GuildID:        model.GuildID,
		ChannelID:      model.ChannelID,
		MessageID:      model.MessageID,
		ThreadName:     model.ThreadName,
		SavedMessageID: model.SavedMessageID,
		Name:           model.Name,
		Description:    model.Description,
		CronExpression: model.CronExpression,
		CronTimezone:   model.CronTimezone,
		StartAt:        model.StartAt,
		EndAt:          model.EndAt,
		NextAt:         model.NextAt,
		OnlyOnce:       model.OnlyOnce,
		Enabled:        model.Enabled,
		CreatedAt:      model.CreatedAt,
		UpdatedAt:      model.UpdatedAt,
	}
}

package scheduled_messages

import (
	"errors"
	"time"

	"log/slog"

	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	scheduled_messages "github.com/merlinfuchs/embed-generator/embedg-server/manager/scheduled_message"
	"github.com/merlinfuchs/embed-generator/embedg-server/manager/webhook"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

type ScheduledMessageHandler struct {
	scheduledMessageStore store.ScheduledMessageStore
	am                    *access.AccessManager
	planStore             store.PlanStore
	webhookManager        *webhook.WebhookManager
}

func New(scheduledMessageStore store.ScheduledMessageStore, am *access.AccessManager, planStore store.PlanStore, webhookManager *webhook.WebhookManager) *ScheduledMessageHandler {
	return &ScheduledMessageHandler{
		scheduledMessageStore: scheduledMessageStore,
		am:                    am,
		planStore:             planStore,
		webhookManager:        webhookManager,
	}
}

// messageSender checks that the message to edit exists in the channel and can be edited, and finds
// who sent it, once here rather than on every run.
func (h *ScheduledMessageHandler) messageSender(c *fiber.Ctx, channelID common.ID, messageID common.NullID) (common.NullID, error) {
	if !messageID.Valid {
		return common.NullID{}, nil
	}

	sender, err := h.webhookManager.MessageSender(c.UserContext(), channelID, messageID.ID)
	if err != nil {
		if common.IsDiscordRestErrorCode(err, rest.JSONErrorCodeUnknownMessage) {
			return common.NullID{}, handlers.BadRequest("unknown_message", "The message to edit doesn't exist in the selected channel.")
		}
		if common.IsDiscordRestErrorCode(err, rest.JSONErrorCodeMissingAccess, rest.JSONErrorCodeLackPermissionsToPerformAction) {
			return common.NullID{}, handlers.BadRequest("missing_permissions", "Embed Generator needs the Read Message History permission in the channel to find the message to edit.")
		}
		return common.NullID{}, err
	}
	return sender, nil
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

	if err := h.am.CheckChannelAccessForRequestInGuild(c, req.ChannelID, guildID); err != nil {
		return err
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.UserContext(), guildID)
	if err != nil {
		return err
	}

	if !req.OnlyOnce && !features.PeriodicScheduledMessages {
		return handlers.Forbidden("insufficient_plan", "Periodic scheduled messages are not available on your plan.")
	}

	if req.EndAt.Valid && req.EndAt.Time.Before(req.StartAt) {
		return handlers.BadRequest("invalid_end_at", "The end_at field must be after the start_at field.")
	}

	if req.StartAt.Before(time.Now().UTC()) {
		req.StartAt = time.Now().UTC()
	}

	nextAt := req.StartAt
	if !req.OnlyOnce {
		var err error
		nextAt, err = scheduled_messages.GetFirstCronTick(req.CronExpression.String, req.StartAt, req.CronTimezone.String)
		if err != nil {
			return handlers.BadRequest("invalid_cron_expression", "The cron expression is invalid.")
		}

		nextNextAt, err := scheduled_messages.GetNextCronTick(req.CronExpression.String, nextAt, req.CronTimezone.String)
		if err != nil {
			return handlers.BadRequest("invalid_cron_expression", "The cron expression is invalid.")
		}

		if nextNextAt.Sub(nextAt) < time.Minute {
			return handlers.BadRequest("invalid_cron_expression", "The cron expression is too tight and will trigger too often.")
		}
	}

	existingCount, err := h.scheduledMessageStore.CountScheduledMessages(c.UserContext(), guildID)
	if err != nil {
		return err
	}

	if int(existingCount) >= features.MaxScheduledMessages {
		return handlers.Forbidden("insufficient_plan", "You have reached the maximum number of scheduled messages for your plan!")
	}

	messageSender, err := h.messageSender(c, req.ChannelID, req.MessageID)
	if err != nil {
		return err
	}

	msg, err := h.scheduledMessageStore.CreateScheduledMessage(c.UserContext(), model.ScheduledMessage{
		ID:               common.InternalID(),
		CreatorID:        session.UserID,
		GuildID:          guildID,
		ChannelID:        req.ChannelID,
		MessageID:        req.MessageID,
		MessageWebhookID: messageSender,
		ThreadName:       req.ThreadName,
		SavedMessageID:   req.SavedMessageID,
		Name:             req.Name,
		Description:      req.Description,
		CronExpression:   req.CronExpression,
		CronTimezone:     req.CronTimezone,
		StartAt:          req.StartAt,
		EndAt:            req.EndAt,
		NextAt:           nextAt,
		OnlyOnce:         req.OnlyOnce,
		CreatedAt:        time.Now().UTC(),
		UpdatedAt:        time.Now().UTC(),
		Enabled:          req.Enabled,
	})
	if err != nil {
		slog.Error("Failed to create scheduled message", slog.Any("error", err))
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

	messages, err := h.scheduledMessageStore.GetScheduledMessages(c.UserContext(), guildID)
	if err != nil {
		slog.Error("Failed to get scheduled messages", slog.Any("error", err))
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

	msg, err := h.scheduledMessageStore.GetScheduledMessage(c.UserContext(), guildID, messageID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("unknown_message", "The scheduled message does not exist or has expired.")
		}
		slog.Error("Failed to get scheduled message", slog.Any("error", err))
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

	if err := h.am.CheckChannelAccessForRequestInGuild(c, req.ChannelID, guildID); err != nil {
		return err
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.UserContext(), guildID)
	if err != nil {
		return err
	}

	if !req.OnlyOnce && !features.PeriodicScheduledMessages {
		return handlers.Forbidden("insufficient_plan", "Periodic scheduled messages are not available on your plan.")
	}

	existing, err := h.scheduledMessageStore.GetScheduledMessage(c.UserContext(), guildID, messageID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("unknown_message", "The scheduled message does not exist.")
		}
		slog.Error("Failed to get scheduled message", slog.Any("error", err))
		return err
	}

	if req.EndAt.Valid && req.EndAt.Time.Before(req.StartAt) {
		return handlers.BadRequest("invalid_end_at", "The end_at field must be after the start_at field.")
	}

	now := time.Now().UTC()

	// Only recompute the schedule when it actually changed, otherwise e.g. toggling
	// enabled would reset start_at and drop a pending send.
	scheduleUnchanged := existing.OnlyOnce == req.OnlyOnce &&
		existing.StartAt.Equal(req.StartAt) &&
		existing.CronExpression.Equal(req.CronExpression) &&
		existing.CronTimezone.Equal(req.CronTimezone)

	// A disabled row with next_at in the past has already fired or was given up on,
	// so re-enabling it needs a fresh schedule instead of an immediate send.
	if !existing.Enabled && existing.NextAt.Before(now) {
		scheduleUnchanged = false
	}

	var nextAt time.Time
	if scheduleUnchanged {
		req.StartAt = existing.StartAt
		nextAt = existing.NextAt
	} else {
		if req.StartAt.Before(now) {
			req.StartAt = now
		}

		nextAt = req.StartAt
		if !req.OnlyOnce {
			nextAt, err = scheduled_messages.GetFirstCronTick(req.CronExpression.String, req.StartAt, req.CronTimezone.String)
			if err != nil {
				return handlers.BadRequest("invalid_cron_expression", "The cron expression is invalid.")
			}

			nextNextAt, err := scheduled_messages.GetNextCronTick(req.CronExpression.String, nextAt, req.CronTimezone.String)
			if err != nil {
				return handlers.BadRequest("invalid_cron_expression", "The cron expression is invalid.")
			}

			if nextNextAt.Sub(nextAt) < time.Minute {
				return handlers.BadRequest("invalid_cron_expression", "The cron expression is too tight and will trigger too often.")
			}
		}
	}

	messageSender, err := h.messageSender(c, req.ChannelID, req.MessageID)
	if err != nil {
		return err
	}

	msg, err := h.scheduledMessageStore.UpdateScheduledMessage(c.UserContext(), model.ScheduledMessage{
		ID:               messageID,
		GuildID:          guildID,
		ChannelID:        req.ChannelID,
		MessageID:        req.MessageID,
		MessageWebhookID: messageSender,
		ThreadName:       req.ThreadName,
		SavedMessageID:   req.SavedMessageID,
		Name:             req.Name,
		Description:      req.Description,
		CronExpression:   req.CronExpression,
		CronTimezone:     req.CronTimezone,
		StartAt:          req.StartAt,
		EndAt:            req.EndAt,
		NextAt:           nextAt,
		OnlyOnce:         req.OnlyOnce,
		Enabled:          req.Enabled,
		UpdatedAt:        time.Now().UTC(),
	})

	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("unknown_message", "The scheduled message does not exist.")
		}
		slog.Error("Failed to update scheduled message", slog.Any("error", err))
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

	err = h.scheduledMessageStore.DeleteScheduledMessage(c.UserContext(), guildID, messageID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("unknown_message", "The scheduled message does not exist.")
		}
		slog.Error("Failed to delete scheduled message", slog.Any("error", err))
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

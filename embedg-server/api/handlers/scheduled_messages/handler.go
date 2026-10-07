package scheduled_messages

import (
	"errors"
	"fmt"
	"slices"
	"time"

	"log/slog"

	"github.com/adhocore/gronx"
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
	"gopkg.in/guregu/null.v4"
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

	if !features.PeriodicScheduledMessages && !req.SendsOnce() {
		return handlers.Forbidden("insufficient_plan", "Repeating scheduled messages and sending on more than one date are not available on your plan.")
	}

	if err := normalizeSchedule(&req.ScheduledMessageScheduleWire); err != nil {
		return err
	}

	nextAt, err := firstRun(&req.ScheduledMessageScheduleWire, time.Now().UTC(), time.Time{})
	if err != nil {
		return err
	}
	if err := endAfterRuns(&req.ScheduledMessageScheduleWire, nextAt); err != nil {
		return err
	}

	if req.Enabled {
		if err := checkRunsBeforeEnd(nextAt, req.EndAt, req.CronTimezone.String); err != nil {
			return err
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
		CronInterval:     req.CronInterval,
		StartAt:          req.StartAt,
		EndAt:            req.EndAt,
		NextAt:           nextAt,
		RunTimes:         req.RunTimes,
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

	if !features.PeriodicScheduledMessages && !req.SendsOnce() {
		return handlers.Forbidden("insufficient_plan", "Repeating scheduled messages and sending on more than one date are not available on your plan.")
	}

	existing, err := h.scheduledMessageStore.GetScheduledMessage(c.UserContext(), guildID, messageID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("unknown_message", "The scheduled message does not exist.")
		}
		slog.Error("Failed to get scheduled message", slog.Any("error", err))
		return err
	}

	if err := normalizeSchedule(&req.ScheduledMessageScheduleWire); err != nil {
		return err
	}
	now := time.Now().UTC()

	// Only recompute the schedule when it actually changed, otherwise e.g. toggling
	// enabled would reset start_at and drop a pending send.
	scheduleUnchanged := slices.EqualFunc(existing.RunTimes, req.RunTimes, time.Time.Equal) &&
		existing.StartAt.Equal(req.StartAt) &&
		existing.CronExpression.Equal(req.CronExpression) &&
		existing.CronTimezone.Equal(req.CronTimezone) &&
		existing.CronInterval == req.CronInterval

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
		// A date that was just sent is in the grace for picked dates, it must not go out again.
		nextAt, err = firstRun(&req.ScheduledMessageScheduleWire, now, existing.LastSentAt.Time)
		if err != nil {
			return err
		}
	}
	if err := endAfterRuns(&req.ScheduledMessageScheduleWire, nextAt); err != nil {
		return err
	}

	if req.Enabled {
		if err := checkRunsBeforeEnd(nextAt, req.EndAt, req.CronTimezone.String); err != nil {
			return err
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
		CronInterval:     req.CronInterval,
		StartAt:          req.StartAt,
		EndAt:            req.EndAt,
		NextAt:           nextAt,
		RunTimes:         req.RunTimes,
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

// How many upcoming runs a preview lists.
const previewRuns = 5

// HandlePreviewScheduledMessage lists when a schedule would send, so it can be checked before it's
// saved. It fails the same way saving it would.
func (h *ScheduledMessageHandler) HandlePreviewScheduledMessage(c *fiber.Ctx, req wire.ScheduledMessageScheduleWire) error {
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	if err := normalizeSchedule(&req); err != nil {
		return err
	}

	first, err := firstRun(&req, time.Now().UTC(), time.Time{})
	if err != nil {
		return err
	}
	if err := endAfterRuns(&req, first); err != nil {
		return err
	}
	if err := checkRunsBeforeEnd(first, req.EndAt, req.CronTimezone.String); err != nil {
		return err
	}

	runs := []time.Time{first}
	if req.OnDates() {
		for _, t := range req.RunTimes {
			if t.After(first) {
				runs = append(runs, t)
			}
		}
	} else {
		sched := schedule(&req)
		for len(runs) <= previewRuns {
			next, err := sched.Next(runs[len(runs)-1])
			if err != nil {
				return err
			}
			if req.EndAt.Valid && next.After(req.EndAt.Time) {
				break
			}
			runs = append(runs, next)
		}
	}

	more := len(runs) > previewRuns
	if more {
		runs = runs[:previewRuns]
	}

	return c.JSON(wire.ScheduledMessagePreviewResponseWire{
		Success: true,
		Data: wire.ScheduledMessagePreviewWire{
			Runs:  runs,
			More:  more,
			EndAt: req.EndAt,
		},
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

// Stored explicitly so that edits compare equal to what was saved.
func timezoneOrUTC(tz null.String) null.String {
	if tz.String == "" {
		return null.StringFrom("UTC")
	}
	return tz
}

// normalizeSchedule checks the schedule of a request and fills in what it leaves open.
func normalizeSchedule(s *wire.ScheduledMessageScheduleWire) error {
	s.CronTimezone = timezoneOrUTC(s.CronTimezone)

	if s.OnDates() {
		// Sorted without duplicates, so the next date is the first one after the last send.
		slices.SortFunc(s.RunTimes, time.Time.Compare)
		s.RunTimes = slices.CompactFunc(s.RunTimes, time.Time.Equal)
		s.StartAt = s.RunTimes[0]
		s.CronInterval = 1
		return nil
	}
	s.RunTimes = nil

	if s.EndAt.Valid && s.EndAt.Time.Before(s.StartAt) {
		return handlers.BadRequest("invalid_end_at", "The end_at field must be after the start_at field.")
	}
	// Clients from before intervals leave it out.
	if s.CronInterval == 0 {
		s.CronInterval = 1
	}
	return nil
}

func schedule(s *wire.ScheduledMessageScheduleWire) scheduled_messages.Schedule {
	return scheduled_messages.Schedule{
		Expression: s.CronExpression.String,
		Timezone:   s.CronTimezone.String,
		Interval:   s.CronInterval,
		Anchor:     s.StartAt,
	}
}

// Dates are picked to the minute, so one in the current minute is a little in the past by the
// time it's saved. It still goes out.
const pickedDateGrace = time.Minute

// firstRun validates the schedule and returns when it first runs, not before now. Dates in the
// past and up to lastSent are skipped. A recurring schedule keeps a start in the past, its
// intervals count from there.
func firstRun(s *wire.ScheduledMessageScheduleWire, now time.Time, lastSent time.Time) (time.Time, error) {
	if s.OnDates() {
		after := now.Add(-pickedDateGrace)
		if lastSent.After(after) {
			after = lastSent
		}
		next, ok := scheduled_messages.NextDate(s.RunTimes, after)
		if !ok {
			return time.Time{}, handlers.BadRequest("never_runs", "All dates of the scheduled message are in the past.")
		}
		if next.Before(now) {
			return now, nil
		}
		return next, nil
	}

	// Without seconds every run is on a different minute, so it can't run more than once a minute.
	if segs, err := gronx.Segments(s.CronExpression.String); err == nil && segs[0] != "0" {
		return time.Time{}, handlers.BadRequest("invalid_cron_expression", "The cron expression is too tight and will trigger too often.")
	}

	sched := schedule(s)
	nextAt, err := sched.First(now)
	if errors.Is(err, scheduled_messages.ErrUnsupportedInterval) {
		return time.Time{}, handlers.BadRequest("invalid_cron_interval", "Repeating every few days, weeks or months only works with a schedule that runs at a fixed time once a minute, hour, day, week or month.")
	}
	if errors.Is(err, scheduled_messages.ErrNeverRuns) {
		return time.Time{}, handlers.BadRequest("never_runs", "The schedule never runs, none of the periods it repeats in has a matching day.")
	}
	if err != nil {
		return time.Time{}, handlers.BadRequest("invalid_cron_expression", "The cron expression is invalid.")
	}

	return nextAt, nil
}

// endAfterRuns turns ending after a number of sends into the end_at of the last one, counted
// from the next send.
func endAfterRuns(s *wire.ScheduledMessageScheduleWire, next time.Time) error {
	if s.OnDates() || s.EndAfterRuns == 0 {
		return nil
	}

	sched := schedule(s)
	last := next
	for range s.EndAfterRuns - 1 {
		var err error
		if last, err = sched.Next(last); err != nil {
			return handlers.BadRequest("invalid_cron_expression", "The cron expression is invalid.")
		}
	}
	s.EndAt = null.TimeFrom(last)
	return nil
}

// checkRunsBeforeEnd rejects schedules whose next run is past end_at, which the
// manager would disable without sending.
func checkRunsBeforeEnd(nextAt time.Time, endAt null.Time, cronTimezone string) error {
	if !endAt.Valid || !nextAt.After(endAt.Time) {
		return nil
	}

	loc, err := common.LoadTimezone(cronTimezone)
	if err != nil {
		loc = time.UTC
	}

	return handlers.BadRequest("never_runs", fmt.Sprintf(
		"The schedule doesn't run before the end date. Its next run would be on %s (%s).",
		nextAt.In(loc).Format("Jan 2, 2006 at 3:04 PM"),
		loc.String(),
	))
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
		CronInterval:   model.CronInterval,
		StartAt:        model.StartAt,
		EndAt:          model.EndAt,
		NextAt:         model.NextAt,
		RunTimes:       model.RunTimes,
		Enabled:        model.Enabled,
		CreatedAt:      model.CreatedAt,
		UpdatedAt:      model.UpdatedAt,
		LastSentAt:     model.LastSentAt,
		LastError:      model.LastError,
		LastErrorAt:    model.LastErrorAt,
	}
}

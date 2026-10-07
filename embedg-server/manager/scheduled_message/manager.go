package scheduled_messages

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/template"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-server/manager/webhook"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"gopkg.in/guregu/null.v4"
)

// How long a due message keeps being retried on transient failures before
// it moves on to the next run, or is disabled after its last date.
const sendRetryWindow = 30 * time.Minute

type ScheduledMessageManager struct {
	scheduledMessageStore store.ScheduledMessageStore
	savedMessageStore     store.SavedMessageStore
	kvEntryStore          store.KVEntryStore
	actionParser          *parser.ActionParser
	webhookManager        *webhook.WebhookManager
	guildState            *guildstate.Provider
	rest                  rest.Rest
	planStore             store.PlanStore
	shards                common.Shards
}

func NewScheduledMessageManager(
	scheduledMessageStore store.ScheduledMessageStore,
	savedMessageStore store.SavedMessageStore,
	kvEntryStore store.KVEntryStore,
	actionParser *parser.ActionParser,
	webhookManager *webhook.WebhookManager,
	guildState *guildstate.Provider,
	rest rest.Rest,
	planStore store.PlanStore,
	shards common.Shards,
) *ScheduledMessageManager {
	m := &ScheduledMessageManager{
		scheduledMessageStore: scheduledMessageStore,
		savedMessageStore:     savedMessageStore,
		kvEntryStore:          kvEntryStore,
		actionParser:          actionParser,
		webhookManager:        webhookManager,
		guildState:            guildState,
		rest:                  rest,
		planStore:             planStore,
		shards:                shards,
	}

	return m
}

func (m *ScheduledMessageManager) Run(ctx context.Context) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			scheduledMessages, err := m.scheduledMessageStore.GetDueScheduledMessages(ctx, time.Now().UTC())
			if err != nil {
				slog.Error(
					"Failed to retrieve scheduled messages",
					slog.Any("error", err),
				)
				continue
			}

			for _, scheduledMessage := range scheduledMessages {
				// Another instance owns the shard this guild is on and will send it.
				if !m.shards.Owns(scheduledMessage.GuildID) {
					continue
				}

				err = m.processScheduledMessage(context.Background(), scheduledMessage)
				if err != nil {
					slog.Error(
						"Failed to process scheduled message",
						slog.Any("error", err),
						slog.String("scheduled_message_id", scheduledMessage.ID),
					)
				}
			}
		}
	}
}

func (m *ScheduledMessageManager) processScheduledMessage(ctx context.Context, scheduledMessage model.ScheduledMessage) error {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	now := time.Now().UTC()

	// The due query doesn't filter on end_at, so rows past it end up here and get
	// disabled instead of staying enabled without ever sending again.
	if scheduledMessage.EndAt.Valid && scheduledMessage.NextAt.After(scheduledMessage.EndAt.Time) {
		return m.record(ctx, scheduledMessage, model.ScheduledMessageRun{
			NextAt:      scheduledMessage.NextAt,
			LastError:   scheduledMessage.LastError,
			LastErrorAt: scheduledMessage.LastErrorAt,
			UpdatedAt:   now,
		})
	}

	var failure null.String
	if sendErr := m.SendScheduledMessage(ctx, scheduledMessage); sendErr != nil {
		outcome, reason := classifyFailure(sendErr)
		if outcome == outcomeRetry && now.Sub(scheduledMessage.NextAt) < sendRetryWindow {
			slog.Warn(
				"Failed to send scheduled message, retrying on next tick",
				slog.Any("error", sendErr),
				slog.String("scheduled_message_id", scheduledMessage.ID),
			)
			return nil
		}

		slog.Error(
			"Failed to send scheduled message",
			slog.Any("error", sendErr),
			slog.String("scheduled_message_id", scheduledMessage.ID),
		)
		if outcome == outcomeStop {
			return m.stop(ctx, scheduledMessage, reason, now)
		}
		failure = null.StringFrom(reason)
	}

	run := model.ScheduledMessageRun{UpdatedAt: now}
	if failure.Valid {
		run.LastError = failure
		run.LastErrorAt = null.TimeFrom(now)
	} else {
		run.LastSentAt = null.TimeFrom(now)
	}

	if scheduledMessage.OnDates() {
		// After the last date there is nothing left to send.
		run.NextAt = scheduledMessage.NextAt
		if next, ok := NextDate(scheduledMessage.RunTimes, now); ok {
			run.NextAt, run.Enabled = next, true
		}
		return m.record(ctx, scheduledMessage, run)
	}

	nextAt, err := ScheduleOf(scheduledMessage).Next(now)
	if err != nil {
		// Leaving next_at in the past would send it again on every tick.
		slog.Error(
			"Failed to compute next run of scheduled message",
			slog.Any("error", err),
			slog.String("scheduled_message_id", scheduledMessage.ID),
		)
		return m.stop(ctx, scheduledMessage, "The schedule is invalid.", now)
	}

	run.NextAt = nextAt
	// A next run past the end date never comes, so the schedule is over.
	run.Enabled = !scheduledMessage.EndAt.Valid || !nextAt.After(scheduledMessage.EndAt.Time)
	return m.record(ctx, scheduledMessage, run)
}

func (m *ScheduledMessageManager) record(ctx context.Context, scheduledMessage model.ScheduledMessage, run model.ScheduledMessageRun) error {
	err := m.scheduledMessageStore.RecordScheduledMessageRun(ctx, scheduledMessage.GuildID, scheduledMessage.ID, run)
	if err != nil {
		return fmt.Errorf("failed to record run of scheduled message: %w", err)
	}
	return nil
}

// stop disables a scheduled message that can't run anymore and keeps the reason for the user.
func (m *ScheduledMessageManager) stop(ctx context.Context, scheduledMessage model.ScheduledMessage, reason string, now time.Time) error {
	slog.Info(
		"Stopping scheduled message",
		slog.String("reason", reason),
		slog.String("scheduled_message_id", scheduledMessage.ID),
	)
	return m.record(ctx, scheduledMessage, model.ScheduledMessageRun{
		NextAt:      scheduledMessage.NextAt,
		LastError:   null.StringFrom(reason),
		LastErrorAt: null.TimeFrom(now),
		UpdatedAt:   now,
	})
}

// channelGone checks against the Discord API whether the channel really doesn't exist
// or is inaccessible. A cache miss alone is not proof: the cache lookup fails on timeouts too.
func (m *ScheduledMessageManager) channelGone(ctx context.Context, channelID common.ID) bool {
	_, err := m.rest.GetChannel(channelID, rest.WithCtx(ctx))
	return common.IsDiscordRestErrorCode(
		err,
		rest.JSONErrorCodeUnknownChannel,
		rest.JSONErrorCodeUnknownGuild,
		rest.JSONErrorCodeMissingAccess,
	)
}

func (m *ScheduledMessageManager) SendScheduledMessage(ctx context.Context, scheduledMessage model.ScheduledMessage) error {
	savedMsg, err := m.savedMessageStore.GetSavedMessageForGuild(ctx, scheduledMessage.GuildID, scheduledMessage.SavedMessageID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return stopWith("The saved message was deleted.")
		}
		return fmt.Errorf("failed to get saved message from scheduled message: %w", err)
	}

	features, err := m.planStore.GetPlanFeaturesForGuild(ctx, scheduledMessage.GuildID)
	if err != nil {
		return fmt.Errorf("could not get plan features: %w", err)
	}

	templateSource := template.NewSource(ctx, m.guildState)
	templates := template.NewContext(
		"SCHEDULED_MESSAGE", features.MaxTemplateOps,
		template.NewGuildProvider(templateSource, scheduledMessage.GuildID, nil),
		template.NewChannelProvider(templateSource, scheduledMessage.ChannelID, nil),
		template.NewKVProvider(templateSource, scheduledMessage.GuildID, m.kvEntryStore, features.MaxKVKeys),
	)

	data := &actions.MessageWithActions{}
	err = json.Unmarshal([]byte(savedMsg.Data), data)
	if err != nil {
		return skipWith("The saved message is invalid: "+err.Error(), err)
	}

	if err := templates.ParseAndExecuteMessage(data); err != nil {
		// Unless a lookup behind the template failed, it fails the same way on the next try.
		if internalErr := templateSource.Err(); internalErr != nil {
			return fmt.Errorf("failed to parse and execute message template: %w", internalErr)
		}
		return skipWith("Template error: "+err.Error(), err)
	}

	params := discord.WebhookMessageCreate{
		Username:        data.Username,
		AvatarURL:       data.AvatarURL,
		AllowedMentions: data.AllowedMentions,
		ThreadName:      scheduledMessage.ThreadName.String,
		Flags:           data.Flags,
	}
	// Discord rejects content and embeds on a components v2 message.
	if !data.ComponentsV2Enabled() {
		params.Content = data.Content
		params.Embeds = data.Embeds
		params.TTS = data.TTS
	}

	params.Components, err = m.actionParser.ParseMessageComponents(data.Components, true)
	if err != nil {
		return skipWith("Invalid components: "+err.Error(), err)
	}

	// Actions carry the creator's authority, so resolve the creator before sending. Without a member
	// the message would go out with empty permissions attached to its actions.
	hasActions := len(data.Actions) != 0

	var creator *discord.Member
	if hasActions {
		creator, err = m.rest.GetMember(scheduledMessage.GuildID, scheduledMessage.CreatorID, rest.WithCtx(ctx))
		if err != nil {
			if common.IsDiscordRestErrorCode(
				err,
				rest.JSONErrorCodeUnknownMember,
				rest.JSONErrorCodeUnknownGuild,
				rest.JSONErrorCodeMissingAccess,
			) {
				return stopWith("The member who created it left the server.")
			}
			return fmt.Errorf("failed to get scheduled message creator: %w", err)
		}
	}

	var msg *discord.Message
	if scheduledMessage.MessageID.Valid {
		update := discord.WebhookMessageUpdate{
			Content:         &params.Content,
			Embeds:          &params.Embeds,
			Components:      &params.Components,
			AllowedMentions: params.AllowedMentions,
		}
		// Only when needed, the flags of a message can't be taken away by an edit.
		if data.ComponentsV2Enabled() {
			update.Flags = &params.Flags
		}
		msg, err = m.webhookManager.UpdateMessageAsSender(ctx, scheduledMessage.ChannelID, scheduledMessage.MessageID.ID, scheduledMessage.MessageWebhookID, update)
	} else {
		msg, err = m.webhookManager.SendMessageToChannel(ctx, scheduledMessage.ChannelID, params)
	}
	if err != nil {
		if errors.Is(err, webhook.ErrChannelNotFound) {
			if m.channelGone(ctx, scheduledMessage.ChannelID) {
				return stopWith("The channel was deleted.")
			}
			return fmt.Errorf("channel not in cache: %w", err)
		}

		// Another user's message is one the custom bot sent before it was replaced by another bot.
		if errors.Is(err, webhook.ErrMessageNotEditable) || common.IsDiscordRestErrorCode(
			err,
			rest.JSONErrorCodeUnknownMessage,
			rest.JSONErrorCodeCannotEditMessageAuthoredByAnotherUser,
		) {
			return stopWith("The message it edits was deleted or can't be edited anymore.")
		}

		if common.IsDiscordRestErrorCode(
			err,
			rest.JSONErrorCodeUnknownChannel,
			rest.JSONErrorCodeUnknownGuild,
			rest.JSONErrorCodeMissingAccess,
			rest.JSONErrorCodeLackPermissionsToPerformAction,
		) {
			return stopWith("Embed Generator can't access the channel anymore.")
		}

		return fmt.Errorf("failed to send or edit message: %w", err)
	}

	// The message is out at this point, failures below must not trigger a resend.
	if !hasActions {
		// An edited message may still have the action sets of what it was before.
		if scheduledMessage.MessageID.Valid {
			if err := m.actionParser.DeleteActionsForMessage(ctx, msg.ID); err != nil {
				slog.Error(
					"Failed to delete actions of edited scheduled message",
					slog.Any("error", err),
					slog.String("scheduled_message_id", scheduledMessage.ID),
				)
			}
		}
		return nil
	}

	permContext, err := m.actionParser.DerivePermissionsForActions(ctx, *creator, scheduledMessage.GuildID, scheduledMessage.ChannelID)
	if err != nil {
		slog.Error(
			"Failed to create permission context for scheduled message actions",
			slog.Any("error", err),
			slog.String("scheduled_message_id", scheduledMessage.ID),
		)
		return nil
	}

	err = m.actionParser.CreateActionsForMessage(ctx, data.Actions, permContext, msg.ID, false)
	if err != nil {
		slog.Error(
			"Failed to create actions for scheduled message",
			slog.Any("error", err),
			slog.String("scheduled_message_id", scheduledMessage.ID),
		)
	}

	return nil
}

func (m *ScheduledMessageManager) OnEvent(event bot.Event) {
	_, ok := event.(*events.GuildChannelDelete)
	if !ok {
		return
	}

	// TODO: Disable scheduled messages for the channel
}

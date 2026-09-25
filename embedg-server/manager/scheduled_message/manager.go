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
)

// How long a due message keeps being retried on transient failures before
// it is skipped (recurring) or disabled (only once).
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

	sendErr := m.SendScheduledMessage(ctx, scheduledMessage)
	if sendErr != nil {
		if now.Sub(scheduledMessage.NextAt) < sendRetryWindow {
			slog.Warn(
				"Failed to send scheduled message, retrying on next tick",
				slog.Any("error", sendErr),
				slog.String("scheduled_message_id", scheduledMessage.ID),
			)
			return nil
		}

		slog.Error(
			"Giving up on scheduled message after retry window",
			slog.Any("error", sendErr),
			slog.String("scheduled_message_id", scheduledMessage.ID),
		)
	}

	if scheduledMessage.OnlyOnce {
		return m.disable(ctx, scheduledMessage, "sent once")
	}

	nextAt, err := GetNextCronTick(
		scheduledMessage.CronExpression.String,
		now,
		scheduledMessage.CronTimezone.String,
	)
	if err != nil {
		return fmt.Errorf("failed to parse cron expression %s from scheduled message: %w", scheduledMessage.CronExpression.String, err)
	}

	err = m.scheduledMessageStore.UpdateScheduledMessageNextAt(ctx, scheduledMessage.GuildID, scheduledMessage.ID, nextAt, now)
	if err != nil {
		return fmt.Errorf("failed to update next_at after sending scheduled message: %w", err)
	}

	return nil
}

func (m *ScheduledMessageManager) disable(ctx context.Context, scheduledMessage model.ScheduledMessage, reason string) error {
	err := m.scheduledMessageStore.UpdateScheduledMessageEnabled(ctx, scheduledMessage.GuildID, scheduledMessage.ID, false, time.Now().UTC())
	if err != nil {
		return fmt.Errorf("failed to disable scheduled message (%s): %w", reason, err)
	}

	slog.Info(
		"Disabled scheduled message",
		slog.String("reason", reason),
		slog.String("scheduled_message_id", scheduledMessage.ID),
	)
	return nil
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
			return m.disable(ctx, scheduledMessage, "saved message not found")
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
		template.NewKVProvider(scheduledMessage.GuildID, m.kvEntryStore, features.MaxKVKeys),
	)

	data := &actions.MessageWithActions{}
	err = json.Unmarshal([]byte(savedMsg.Data), data)
	if err != nil {
		return err
	}

	if err := templates.ParseAndExecuteMessage(data); err != nil {
		return fmt.Errorf("failed to parse and execute message template: %w", err)
	}

	params := discord.WebhookMessageCreate{
		Content:         data.Content,
		Username:        data.Username,
		AvatarURL:       data.AvatarURL,
		TTS:             data.TTS,
		Embeds:          data.Embeds,
		AllowedMentions: data.AllowedMentions,
		ThreadName:      scheduledMessage.ThreadName.String,
		Flags:           data.Flags,
	}

	params.Components, err = m.actionParser.ParseMessageComponents(data.Components, features.ComponentTypes)
	if err != nil {
		return fmt.Errorf("failed to parse message components: %w", err)
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
				return m.disable(ctx, scheduledMessage, "creator is no longer a member of the server")
			}
			return fmt.Errorf("failed to get scheduled message creator: %w", err)
		}
	}

	var msg *discord.Message
	if scheduledMessage.MessageID.Valid {
		msg, err = m.webhookManager.UpdateMessageInChannel(ctx, scheduledMessage.ChannelID, scheduledMessage.MessageID.ID, discord.WebhookMessageUpdate{
			Content:         &params.Content,
			Embeds:          &params.Embeds,
			Components:      &params.Components,
			AllowedMentions: params.AllowedMentions,
		})
	} else {
		msg, err = m.webhookManager.SendMessageToChannel(ctx, scheduledMessage.ChannelID, params)
	}
	if err != nil {
		if errors.Is(err, webhook.ErrChannelNotFound) {
			if m.channelGone(ctx, scheduledMessage.ChannelID) {
				return m.disable(ctx, scheduledMessage, "channel not found")
			}
			return fmt.Errorf("channel not in cache: %w", err)
		}

		if errors.Is(err, webhook.ErrMessageNotEditable) || common.IsDiscordRestErrorCode(err, rest.JSONErrorCodeUnknownMessage) {
			return m.disable(ctx, scheduledMessage, "message to edit is gone or can't be edited")
		}

		if common.IsDiscordRestErrorCode(
			err,
			rest.JSONErrorCodeUnknownChannel,
			rest.JSONErrorCodeUnknownGuild,
			rest.JSONErrorCodeMissingAccess,
			rest.JSONErrorCodeLackPermissionsToPerformAction,
		) {
			return m.disable(ctx, scheduledMessage, "channel inaccessible")
		}

		return fmt.Errorf("failed to send or edit message: %w", err)
	}

	// The message is out at this point, failures below must not trigger a resend.
	if !hasActions {
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

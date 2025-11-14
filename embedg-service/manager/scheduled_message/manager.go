package scheduled_messages

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/template"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/webhook"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

type ScheduledMessageManager struct {
	scheduledMessageStore store.ScheduledMessageStore
	savedMessageStore     store.SavedMessageStore
	kvEntryStore          store.KVEntryStore
	actionParser          *parser.ActionParser
	webhookManager        *webhook.WebhookManager
	cache                 cache.Caches
	planStore             store.PlanStore
}

func NewScheduledMessageManager(
	scheduledMessageStore store.ScheduledMessageStore,
	savedMessageStore store.SavedMessageStore,
	kvEntryStore store.KVEntryStore,
	actionParser *parser.ActionParser,
	webhookManager *webhook.WebhookManager,
	cache cache.Caches,
	planStore store.PlanStore,
) *ScheduledMessageManager {
	m := &ScheduledMessageManager{
		scheduledMessageStore: scheduledMessageStore,
		savedMessageStore:     savedMessageStore,
		kvEntryStore:          kvEntryStore,
		actionParser:          actionParser,
		webhookManager:        webhookManager,
		cache:                 cache,
		planStore:             planStore,
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
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if scheduledMessage.OnlyOnce {
		err := m.SendScheduledMessage(ctx, scheduledMessage)
		if err != nil {
			return fmt.Errorf("failed to send scheduled message: %w", err)
		}

		err = m.scheduledMessageStore.UpdateScheduledMessageEnabled(ctx, scheduledMessage.GuildID, scheduledMessage.ID, false, time.Now().UTC())
		if err != nil {
			return fmt.Errorf("failed to disable after sending scheduled message: %w", err)
		}
	} else {
		nextAt, err := GetNextCronTick(
			scheduledMessage.CronExpression.String,
			time.Now().UTC(),
			scheduledMessage.CronTimezone.String,
		)
		if err != nil {
			return fmt.Errorf("failed to parse cron expression %s from scheduled message: %w", scheduledMessage.CronExpression.String, err)
		}

		err = m.SendScheduledMessage(context.Background(), scheduledMessage)
		if err != nil {
			return fmt.Errorf("failed to send scheduled message: %w", err)
		}

		err = m.scheduledMessageStore.UpdateScheduledMessageNextAt(ctx, scheduledMessage.GuildID, scheduledMessage.ID, nextAt, time.Now().UTC())
		if err != nil {
			return fmt.Errorf("failed to update next_at after sending scheduled message: %w", err)
		}
	}

	return nil
}

func (m *ScheduledMessageManager) SendScheduledMessage(ctx context.Context, scheduledMessage model.ScheduledMessage) error {
	savedMsg, err := m.savedMessageStore.GetSavedMessageForGuild(ctx, scheduledMessage.GuildID, scheduledMessage.SavedMessageID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			err := m.scheduledMessageStore.UpdateScheduledMessageEnabled(ctx, scheduledMessage.GuildID, scheduledMessage.ID, false, time.Now().UTC())
			if err != nil {
				slog.Error(
					"Failed to disable scheduled message after failed to get saved message",
					slog.Any("error", err),
					slog.String("scheduled_message_id", scheduledMessage.ID),
				)
			}
			return nil
		}
		return fmt.Errorf("Failed to get saved message from scheduled message: %w", err)
	}

	features, err := m.planStore.GetPlanFeaturesForGuild(ctx, scheduledMessage.GuildID)
	if err != nil {
		return fmt.Errorf("could not get plan features: %w", err)
	}

	templates := template.NewContext(
		"SCHEDULED_MESSAGE", features.MaxTemplateOps,
		template.NewGuildProvider(m.cache, scheduledMessage.GuildID, nil),
		template.NewChannelProvider(m.cache, scheduledMessage.ChannelID, nil),
		template.NewKVProvider(scheduledMessage.GuildID, m.kvEntryStore, features.MaxKVKeys),
	)

	data := &actions.MessageWithActions{}
	err = json.Unmarshal([]byte(savedMsg.Data), data)
	if err != nil {
		return err
	}

	if err := templates.ParseAndExecuteMessage(data); err != nil {
		return fmt.Errorf("Failed to parse and execute message template: %w", err)
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
		return fmt.Errorf("Failed to parse message components: %w", err)
	}

	msg, err := m.webhookManager.SendMessageToChannel(ctx, scheduledMessage.ChannelID, params)
	if err != nil {
		return fmt.Errorf("Failed to send message: %w", err)
	}

	permContext, err := m.actionParser.DerivePermissionsForActions(scheduledMessage.CreatorID, scheduledMessage.GuildID, scheduledMessage.ChannelID)
	if err != nil {
		return fmt.Errorf("Failed to create permission context: %w", err)
	}

	err = m.actionParser.CreateActionsForMessage(ctx, data.Actions, permContext, msg.ID, false)
	if err != nil {
		return fmt.Errorf("failed to create actions for message: %w", err)
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

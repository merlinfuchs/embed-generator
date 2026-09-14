package scheduled_messages

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/template"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"github.com/rs/zerolog/log"
)

type ScheduledMessageManager struct {
	pg           *postgres.PostgresStore
	bot          *bot.Bot
	actionParser *parser.ActionParser
	planStore    store.PlanStore
}

func NewScheduledMessageManager(
	pg *postgres.PostgresStore,
	actionParser *parser.ActionParser,
	bot *bot.Bot,
	planStore store.PlanStore,
) *ScheduledMessageManager {
	m := &ScheduledMessageManager{
		pg:           pg,
		bot:          bot,
		actionParser: actionParser,
		planStore:    planStore,
	}

	go m.lazySendScheduledMessagesTask()

	return m
}

// How long a due message keeps being retried on transient failures before
// it is skipped (recurring) or disabled (only once).
const sendRetryWindow = 30 * time.Minute

func (m *ScheduledMessageManager) lazySendScheduledMessagesTask() {
	for {
		time.Sleep(10 * time.Second)

		scheduledMessages, err := m.pg.Q.GetDueScheduledMessages(context.Background(), time.Now().UTC())
		if err != nil {
			log.Error().Err(err).Msg("Failed to retrieve scheduled messages")
			continue
		}

		for _, scheduledMessage := range scheduledMessages {
			err := m.processScheduledMessage(context.Background(), scheduledMessage)
			if err != nil {
				log.Error().Err(err).Str("scheduled_message_id", scheduledMessage.ID).Msg("Failed to process scheduled message")
			}
		}
	}
}

func (m *ScheduledMessageManager) processScheduledMessage(ctx context.Context, scheduledMessage pgmodel.ScheduledMessage) error {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	now := time.Now().UTC()

	sendErr := m.SendScheduledMessage(ctx, scheduledMessage)
	if sendErr != nil {
		if now.Sub(scheduledMessage.NextAt) < sendRetryWindow {
			log.Warn().Err(sendErr).Str("scheduled_message_id", scheduledMessage.ID).Msg("Failed to send scheduled message, retrying on next tick")
			return nil
		}

		log.Error().Err(sendErr).Str("scheduled_message_id", scheduledMessage.ID).Msg("Giving up on scheduled message after retry window")
	}

	if scheduledMessage.OnlyOnce {
		_, err := m.pg.Q.UpdateScheduledMessageEnabled(ctx, pgmodel.UpdateScheduledMessageEnabledParams{
			ID:        scheduledMessage.ID,
			GuildID:   scheduledMessage.GuildID,
			Enabled:   false,
			UpdatedAt: now,
		})
		if err != nil {
			return fmt.Errorf("failed to disable after sending scheduled message: %w", err)
		}
		return nil
	}

	nextAt, err := GetNextCronTick(
		scheduledMessage.CronExpression.String,
		now,
		scheduledMessage.CronTimezone.String,
	)
	if err != nil {
		return fmt.Errorf("failed to parse cron expression %s from scheduled message: %w", scheduledMessage.CronExpression.String, err)
	}

	_, err = m.pg.Q.UpdateScheduledMessageNextAt(ctx, pgmodel.UpdateScheduledMessageNextAtParams{
		ID:        scheduledMessage.ID,
		GuildID:   scheduledMessage.GuildID,
		NextAt:    nextAt,
		UpdatedAt: now,
	})
	if err != nil {
		return fmt.Errorf("failed to update next_at after sending scheduled message: %w", err)
	}

	return nil
}

func (m *ScheduledMessageManager) SendScheduledMessage(ctx context.Context, scheduledMessage pgmodel.ScheduledMessage) error {
	savedMsg, err := m.pg.Q.GetSavedMessageForGuild(ctx, pgmodel.GetSavedMessageForGuildParams{
		ID: scheduledMessage.SavedMessageID,
		GuildID: sql.NullString{
			String: scheduledMessage.GuildID,
			Valid:  true,
		},
	})
	if err != nil {
		return fmt.Errorf("Failed to get saved message from scheduled message: %w", err)
	}

	features, err := m.planStore.GetPlanFeaturesForGuild(ctx, scheduledMessage.GuildID)
	if err != nil {
		return fmt.Errorf("could not get plan features: %w", err)
	}

	templates := template.NewContext(
		"SCHEDULED_MESSAGE", features.MaxTemplateOps,
		template.NewGuildProvider(m.bot.State, scheduledMessage.GuildID, nil),
		template.NewChannelProvider(m.bot.State, scheduledMessage.ChannelID, nil),
		template.NewKVProvider(scheduledMessage.GuildID, m.pg, features.MaxKVKeys),
	)

	data := &actions.MessageWithActions{}
	err = json.Unmarshal([]byte(savedMsg.Data), data)
	if err != nil {
		return err
	}

	if err := templates.ParseAndExecuteMessage(data); err != nil {
		return fmt.Errorf("Failed to parse and execute message template: %w", err)
	}

	params := &discordgo.WebhookParams{
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
		return helpers.BadRequest("invalid_actions", err.Error())
	}

	msg, err := m.bot.SendMessageToChannel(ctx, scheduledMessage.ChannelID, params)
	if err != nil {
		return fmt.Errorf("Failed to send message: %w", err)
	}

	// The message is out at this point, failures below must not trigger a resend.
	permContext, err := m.actionParser.DerivePermissionsForActions(scheduledMessage.CreatorID, scheduledMessage.GuildID, scheduledMessage.ChannelID)
	if err != nil {
		log.Error().Err(err).Str("scheduled_message_id", scheduledMessage.ID).Msg("Failed to create permission context for scheduled message actions")
		return nil
	}

	err = m.actionParser.CreateActionsForMessage(ctx, data.Actions, permContext, msg.ID, false)
	if err != nil {
		log.Error().Err(err).Str("scheduled_message_id", scheduledMessage.ID).Msg("Failed to create actions for scheduled message")
	}

	return nil
}

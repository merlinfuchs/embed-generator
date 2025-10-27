package scheduled_messages

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/template"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/embedg"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
)

type ScheduledMessageManager struct {
	pg           *postgres.PostgresStore
	embedg       *embedg.EmbedGenerator
	actionParser *parser.ActionParser
	planStore    store.PlanStore
}

func NewScheduledMessageManager(
	pg *postgres.PostgresStore,
	actionParser *parser.ActionParser,
	embedg *embedg.EmbedGenerator,
	planStore store.PlanStore,
) *ScheduledMessageManager {
	m := &ScheduledMessageManager{
		pg:           pg,
		embedg:       embedg,
		actionParser: actionParser,
		planStore:    planStore,
	}

	go m.lazySendScheduledMessagesTask()

	return m
}

func (m *ScheduledMessageManager) lazySendScheduledMessagesTask() {
	for {
		time.Sleep(10 * time.Second)

		scheduledMessages, err := m.pg.Q.GetDueScheduledMessages(context.Background(), time.Now().UTC())
		if err != nil {
			log.Error().Err(err).Msg("Failed to retrieve scheduled messages")
			continue
		}

		for _, scheduledMessage := range scheduledMessages {
			if scheduledMessage.OnlyOnce {
				err = m.SendScheduledMessage(context.Background(), scheduledMessage)
				if err != nil {
					log.Error().Err(err).Msg("Failed to send scheduled message")
				}

				_, err := m.pg.Q.UpdateScheduledMessageEnabled(context.Background(), pgmodel.UpdateScheduledMessageEnabledParams{
					ID:        scheduledMessage.ID,
					GuildID:   scheduledMessage.GuildID,
					Enabled:   false,
					UpdatedAt: time.Now().UTC(),
				})
				if err != nil {
					log.Error().Err(err).Msg("Failed to disable after sending scheduled message")
					continue
				}
			} else {
				nextAt, err := GetNextCronTick(
					scheduledMessage.CronExpression.String,
					time.Now().UTC(),
					scheduledMessage.CronTimezone.String,
				)
				if err != nil {
					log.Error().Err(err).Str("cron", scheduledMessage.CronExpression.String).Msg("Failed to parse cron expression from scheduled message")
					continue
				}

				err = m.SendScheduledMessage(context.Background(), scheduledMessage)
				if err != nil {
					log.Error().Err(err).Msg("Failed to send scheduled message")
				}

				_, err = m.pg.Q.UpdateScheduledMessageNextAt(context.Background(), pgmodel.UpdateScheduledMessageNextAtParams{
					ID:        scheduledMessage.ID,
					GuildID:   scheduledMessage.GuildID,
					NextAt:    nextAt,
					UpdatedAt: time.Now().UTC(),
				})
				if err != nil {
					log.Error().Err(err).Msg("Failed to update next_at after sending scheduled message")
					continue
				}
			}
		}
	}
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

	features, err := m.planStore.GetPlanFeaturesForGuild(ctx, util.ToID(scheduledMessage.GuildID))
	if err != nil {
		return fmt.Errorf("could not get plan features: %w", err)
	}

	templates := template.NewContext(
		"SCHEDULED_MESSAGE", features.MaxTemplateOps,
		template.NewGuildProvider(m.embedg.Caches(), util.ToID(scheduledMessage.GuildID), nil),
		template.NewChannelProvider(m.embedg.Caches(), util.ToID(scheduledMessage.ChannelID), nil),
		template.NewKVProvider(util.ToID(scheduledMessage.GuildID), m.pg, features.MaxKVKeys),
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
		return helpers.BadRequest("invalid_actions", err.Error())
	}

	msg, err := m.embedg.SendMessageToChannel(ctx, util.ToID(scheduledMessage.ChannelID), params)
	if err != nil {
		return fmt.Errorf("Failed to send message: %w", err)
	}

	permContext, err := m.actionParser.DerivePermissionsForActions(util.ToID(scheduledMessage.CreatorID), util.ToID(scheduledMessage.GuildID), util.ToID(scheduledMessage.ChannelID))
	if err != nil {
		return fmt.Errorf("Failed to create permission context: %w", err)
	}

	err = m.actionParser.CreateActionsForMessage(ctx, data.Actions, permContext, msg.ID, false)
	if err != nil {
		log.Error().Err(err).Msg("failed to create actions for message")
		return err
	}

	return nil
}

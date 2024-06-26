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
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
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
	webhook, err := m.bot.FindWebhookForChannel(scheduledMessage.ChannelID)
	if err != nil {
		return fmt.Errorf("Failed to get webhook for channel: %w", err)
	}
	threadID := ""
	if webhook.ChannelID != scheduledMessage.ChannelID {
		threadID = scheduledMessage.ChannelID
	}

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
	}

	customBot, err := m.pg.Q.GetCustomBotByGuildID(ctx, scheduledMessage.GuildID)
	if err != nil {
		if err != sql.ErrNoRows {
			log.Error().Err(err).Msg("failed to get custom bot for message username and avatar")
		}
	} else {
		if params.Username == "" {
			params.Username = customBot.UserName
		}
		if params.AvatarURL == "" {
			params.AvatarURL = util.DiscordAvatarURL(customBot.UserID, customBot.UserDiscriminator, customBot.UserAvatar.String)
		}
	}

	components, err := m.actionParser.ParseMessageComponents(data.Components)
	if err != nil {
		return helpers.BadRequest("invalid_actions", err.Error())
	}

	params.Components = components

	var msg *discordgo.Message
	if threadID != "" {
		msg, err = m.bot.Session.WebhookThreadExecute(webhook.ID, webhook.Token, true, threadID, params)
	} else {
		msg, err = m.bot.Session.WebhookExecute(webhook.ID, webhook.Token, true, params)
	}
	if err != nil {
		return fmt.Errorf("Failed to send message: %w", err)
	}

	permContext, err := m.actionParser.DerivePermissionsForActions(scheduledMessage.CreatorID, scheduledMessage.GuildID, scheduledMessage.ChannelID)
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

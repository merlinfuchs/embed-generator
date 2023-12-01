package scheduled_messages

import (
	"context"
	"fmt"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/robfig/cron/v3"
	"github.com/rs/zerolog/log"
)

type ScheduledMessageManager struct {
	pg *postgres.PostgresStore
}

func NewScheduledMessageManager(pg *postgres.PostgresStore) *ScheduledMessageManager {
	m := &ScheduledMessageManager{
		pg: pg,
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

		cronParser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)

		for _, scheduledMessage := range scheduledMessages {
			schedule, err := cronParser.Parse(scheduledMessage.CronExpression.String)
			if err != nil {
				log.Error().Err(err).Str("cron", scheduledMessage.CronExpression.String).Msg("Failed to parse cron expression")
				continue
			}

			nextTrigger := schedule.Next(time.Now().UTC())
			fmt.Println(nextTrigger)

			nextNextTrigger := schedule.Next(nextTrigger)
			fmt.Println(nextNextTrigger)

			if nextNextTrigger.Sub(nextTrigger) < time.Minute {
				fmt.Println("cron schedule is too tight, skipping")
				continue
			}
		}
	}
}

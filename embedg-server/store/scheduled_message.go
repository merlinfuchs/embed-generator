package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

type ScheduledMessageStore interface {
	GetDueScheduledMessages(ctx context.Context, now time.Time) ([]model.ScheduledMessage, error)
	GetScheduledMessages(ctx context.Context, guildID common.ID) ([]model.ScheduledMessage, error)
	GetScheduledMessage(ctx context.Context, guildID common.ID, id string) (*model.ScheduledMessage, error)
	CountScheduledMessages(ctx context.Context, guildID common.ID) (int64, error)
	DeleteScheduledMessage(ctx context.Context, guildID common.ID, id string) error
	CreateScheduledMessage(ctx context.Context, msg model.ScheduledMessage) (*model.ScheduledMessage, error)
	UpdateScheduledMessage(ctx context.Context, msg model.ScheduledMessage) (*model.ScheduledMessage, error)
	RecordScheduledMessageRun(ctx context.Context, guildID common.ID, id string, run model.ScheduledMessageRun) error
}

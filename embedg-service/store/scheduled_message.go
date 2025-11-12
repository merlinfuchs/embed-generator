package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type ScheduledMessageStore interface {
	GetDueScheduledMessages(ctx context.Context, now time.Time) ([]model.ScheduledMessage, error)
	GetScheduledMessages(ctx context.Context, guildID common.ID) ([]model.ScheduledMessage, error)
	GetScheduledMessage(ctx context.Context, id common.ID, guildID common.ID) (*model.ScheduledMessage, error)
	DeleteScheduledMessage(ctx context.Context, id common.ID, guildID common.ID) error
	CreateScheduledMessage(ctx context.Context, msg model.ScheduledMessage) error
	UpdateScheduledMessage(ctx context.Context, msg model.ScheduledMessage) error
	UpdateScheduledMessageNextAt(ctx context.Context, id common.ID, guildID common.ID, nextAt time.Time) error
	UpdateScheduledMessageEnabled(ctx context.Context, id common.ID, guildID common.ID, enabled bool) error
}

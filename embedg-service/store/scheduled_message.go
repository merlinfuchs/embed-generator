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
	GetScheduledMessage(ctx context.Context, guildID common.ID, id string) (*model.ScheduledMessage, error)
	DeleteScheduledMessage(ctx context.Context, guildID common.ID, id string) error
	CreateScheduledMessage(ctx context.Context, msg model.ScheduledMessage) error
	UpdateScheduledMessage(ctx context.Context, msg model.ScheduledMessage) error
	UpdateScheduledMessageNextAt(ctx context.Context, guildID common.ID, id string, nextAt time.Time, updatedAt time.Time) error
	UpdateScheduledMessageEnabled(ctx context.Context, guildID common.ID, id string, enabled bool, updatedAt time.Time) error
}

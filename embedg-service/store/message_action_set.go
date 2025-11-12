package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type MessageActionSetStore interface {
	CreateMessageActionSet(ctx context.Context, messageActionSet model.MessageActionSet) (*model.MessageActionSet, error)
	GetMessageActionSet(ctx context.Context, messageID common.ID, actionSetID string) (*model.MessageActionSet, error)
	GetMessageActionSets(ctx context.Context, messageID common.ID) ([]model.MessageActionSet, error)
	DeleteMessageActionSetsForMessage(ctx context.Context, messageID common.ID) error
}

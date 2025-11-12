package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type SavedMessageStore interface {
	CreateSavedMessage(ctx context.Context, msg model.SavedMessage) error
	UpdateSavedMessageForCreator(ctx context.Context, msg model.SavedMessage) error
	UpdateSavedMessageForGuild(ctx context.Context, msg model.SavedMessage) error
	DeleteSavedMessageForCreator(ctx context.Context, msg model.SavedMessage) error
	DeleteSavedMessageForGuild(ctx context.Context, msg model.SavedMessage) error
	GetSavedMessagesForCreator(ctx context.Context, creatorID common.ID) ([]model.SavedMessage, error)
	GetSavedMessagesForGuild(ctx context.Context, guildID common.ID) ([]model.SavedMessage, error)
	GetSavedMessageForGuild(ctx context.Context, guildID common.ID, id string) (*model.SavedMessage, error)
}

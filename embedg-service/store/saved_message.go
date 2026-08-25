package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type SavedMessageStore interface {
	CreateSavedMessage(ctx context.Context, msg model.SavedMessage) (*model.SavedMessage, error)
	UpdateSavedMessageForCreator(ctx context.Context, msg model.SavedMessage) (*model.SavedMessage, error)
	UpdateSavedMessageForGuild(ctx context.Context, msg model.SavedMessage) (*model.SavedMessage, error)
	DeleteSavedMessageForCreator(ctx context.Context, creatorID common.ID, id string) error
	DeleteSavedMessageForGuild(ctx context.Context, guildID common.ID, id string) error
	GetSavedMessagesForCreator(ctx context.Context, creatorID common.ID) ([]model.SavedMessage, error)
	GetSavedMessagesForGuild(ctx context.Context, guildID common.ID) ([]model.SavedMessage, error)
	GetSavedMessageForGuild(ctx context.Context, guildID common.ID, id string) (*model.SavedMessage, error)
}

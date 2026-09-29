package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
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
	// GetSavedMessageNamesForGuild returns the newest saved messages of the guild with only their
	// ID and name, without loading the messages.
	GetSavedMessageNamesForGuild(ctx context.Context, guildID common.ID, limit int) ([]model.SavedMessage, error)
	CountSavedMessagesForCreator(ctx context.Context, creatorID common.ID) (int64, error)
	CountSavedMessagesForGuild(ctx context.Context, guildID common.ID) (int64, error)
}

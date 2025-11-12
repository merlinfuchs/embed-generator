package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type CustomCommandStore interface {
	GetCustomCommands(ctx context.Context, guildID common.ID) ([]*model.CustomCommand, error)
	GetCustomCommand(ctx context.Context, guildID common.ID, id string) (*model.CustomCommand, error)
	GetCustomCommandByName(ctx context.Context, guildID common.ID, name string) (*model.CustomCommand, error)
	CountCustomCommands(ctx context.Context, guildID common.ID) (int64, error)
	CreateCustomCommand(ctx context.Context, customCommand model.CustomCommand) (*model.CustomCommand, error)
	UpdateCustomCommand(ctx context.Context, customCommand model.CustomCommand) (*model.CustomCommand, error)
	DeleteCustomCommand(ctx context.Context, guildID common.ID, id string) (*model.CustomCommand, error)
	SetCustomCommandsDeployedAt(ctx context.Context, guildID common.ID, deployedAt time.Time) (*model.CustomCommand, error)
}

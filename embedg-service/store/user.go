package store

import (
	"context"

	"github.com/disgoorg/snowflake/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type UserStore interface {
	UpsertUser(ctx context.Context, user model.User) error
	GetUser(ctx context.Context, userID snowflake.ID) (*model.User, error)
	DeleteUser(ctx context.Context, userID snowflake.ID) error
}

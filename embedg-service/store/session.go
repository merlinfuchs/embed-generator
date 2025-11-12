package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type SessionStore interface {
	CreateSession(ctx context.Context, session model.Session) error
	GetSession(ctx context.Context, tokenHash string) (*model.Session, error)
	DeleteSession(ctx context.Context, tokenHash string) error
	GetSessionsForUser(ctx context.Context, userID string) ([]model.Session, error)
}

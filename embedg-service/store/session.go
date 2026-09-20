package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type UpdateSessionTokensParams struct {
	TokenHash      string
	AccessToken    string
	RefreshToken   string
	TokenExpiresAt time.Time
}

type SessionStore interface {
	CreateSession(ctx context.Context, session model.Session) error
	UpdateSessionTokens(ctx context.Context, params UpdateSessionTokensParams) error
	GetSession(ctx context.Context, tokenHash string) (*model.Session, error)
	DeleteSession(ctx context.Context, tokenHash string) error
	GetSessionsForUser(ctx context.Context, userID string) ([]model.Session, error)
}

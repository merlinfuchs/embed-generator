package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/model"
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
	DeleteExpiredSessions(ctx context.Context) error
	GetSessionsForUser(ctx context.Context, userID string) ([]model.Session, error)
}

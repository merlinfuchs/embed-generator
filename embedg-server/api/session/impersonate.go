package session

import (
	"context"
	"fmt"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

// CreateImpersonationSession creates a session token for the user from their most recent login, to
// inject into the session_token cookie. It leaves out the refresh token: Discord rotates it on use,
// so a refresh from the copy would sign the user's own session out. The copy expires with the
// access token instead.
func CreateImpersonationSession(ctx context.Context, sessionStore store.SessionStore, userID common.ID) (string, error) {
	sessions, err := sessionStore.GetSessionsForUser(ctx, userID.String())
	if err != nil {
		return "", fmt.Errorf("failed to get sessions: %w", err)
	}

	var from *model.Session
	for i, s := range sessions {
		if from == nil || s.TokenExpiresAt.After(from.TokenExpiresAt) {
			from = &sessions[i]
		}
	}
	if from == nil || time.Until(from.TokenExpiresAt) < 10*time.Minute {
		return "", fmt.Errorf("user has no session with a live access token, they have to log in first")
	}

	token := generateSessionToken()
	tokenHash, err := hashSessionToken(token)
	if err != nil {
		return "", err
	}

	err = sessionStore.CreateSession(ctx, model.Session{
		TokenHash:      tokenHash,
		UserID:         from.UserID,
		GuildIds:       from.GuildIds,
		AccessToken:    from.AccessToken,
		TokenExpiresAt: from.TokenExpiresAt,
		Scopes:         from.Scopes,
		CreatedAt:      time.Now().UTC(),
		ExpiresAt:      from.TokenExpiresAt,
	})
	if err != nil {
		return "", fmt.Errorf("failed to create session: %w", err)
	}

	return token, nil
}

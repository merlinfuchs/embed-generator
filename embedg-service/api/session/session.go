package session

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"errors"
	"fmt"
	"time"

	"log/slog"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

type Session struct {
	UserID      common.ID
	GuildIDs    []common.ID
	AccessToken string
	CreatedAt   time.Time
	ExpiresAt   time.Time
}

type SessionManagerConfig struct {
	InsecureCookies bool
}

type SessionManager struct {
	config       SessionManagerConfig
	sessionStore store.SessionStore
}

func New(config SessionManagerConfig, sessionStore store.SessionStore) *SessionManager {
	return &SessionManager{
		config:       config,
		sessionStore: sessionStore,
	}
}

func (s *SessionManager) GetSession(c *fiber.Ctx) (*Session, error) {
	token := c.Cookies("session_token", c.Get("Authorization"))
	if token == "" {
		return nil, nil
	}

	tokenHash, err := hashSessionToken(token)
	if err != nil {
		return nil, err
	}

	model, err := s.sessionStore.GetSession(c.Context(), tokenHash)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &Session{
		UserID:      model.UserID,
		GuildIDs:    model.GuildIds,
		AccessToken: model.AccessToken,
		CreatedAt:   model.CreatedAt,
		ExpiresAt:   model.ExpiresAt,
	}, nil
}

func (s *SessionManager) CreateSession(ctx context.Context, userID common.ID, guildIDs []common.ID, accessToken string) (string, error) {
	token := generateSessionToken()

	tokenHash, err := hashSessionToken(token)
	if err != nil {
		return "", err
	}

	err = s.sessionStore.CreateSession(ctx, model.Session{
		TokenHash:   tokenHash,
		UserID:      userID,
		GuildIds:    guildIDs,
		AccessToken: accessToken,
		CreatedAt:   time.Now().UTC(),
		ExpiresAt:   time.Now().UTC().Add(30 * 24 * time.Hour),
	})
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *SessionManager) CreateSessionCookie(c *fiber.Ctx, token string) {
	c.Cookie(&fiber.Cookie{
		Name:     "session_token",
		Value:    token,
		HTTPOnly: true,
		Secure:   !s.config.InsecureCookies,
		SameSite: "strict",
		Expires:  time.Now().UTC().Add(30 * 24 * time.Hour),
	})
}

func (s *SessionManager) DeleteSession(c *fiber.Ctx) error {
	token := c.Cookies("session_token")
	if token == "" {
		return nil
	}

	c.ClearCookie("session_token")

	tokenHash, err := hashSessionToken(token)
	if err != nil {
		return err
	}

	return s.sessionStore.DeleteSession(c.Context(), tokenHash)
}

func generateSessionToken() string {
	b := make([]byte, 35)
	if _, err := rand.Read(b); err != nil {
		slog.Error("failed to generate random bytes for session token", slog.Any("error", err))
		os.Exit(1)
	}

	token := base32.HexEncoding.EncodeToString(b)
	return token
}

func hashSessionToken(token string) (string, error) {
	b, err := base32.HexEncoding.DecodeString(token)
	if err != nil {
		return "", fmt.Errorf("failed to decode token: %v", err)
	}
	tokenHashBytes := sha256.Sum256(b)
	tokenHash := base32.HexEncoding.EncodeToString(tokenHashBytes[:])

	return tokenHash, nil
}

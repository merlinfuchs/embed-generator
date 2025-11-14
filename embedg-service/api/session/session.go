package session

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base32"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

type Session struct {
	UserID      common.ID
	GuildIDs    []common.ID
	AccessToken string
	CreatedAt   time.Time
	ExpiresAt   time.Time
}

type SessionManager struct {
	sessionStore store.SessionStore
}

func New(sessionStore store.SessionStore) *SessionManager {
	return &SessionManager{
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
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	guildIDs := make([]common.ID, len(model.GuildIds))
	for i, guildID := range model.GuildIds {
		guildIDs[i] = guildID
	}

	return &Session{
		UserID:      model.UserID,
		GuildIDs:    guildIDs,
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
		Secure:   !viper.GetBool("api.insecure_cookies"),
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
		log.Fatal().Err(err).Msg("failed to generate random bytes for session token")
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

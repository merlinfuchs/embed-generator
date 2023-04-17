package session

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base32"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
)

type Session struct {
	UserID      string
	GuildIDs    []string
	AccessToken string
	CreatedAt   time.Time
	ExpiresAt   time.Time
}

type SessionManager struct {
	pg *postgres.PostgresStore
}

func New(pg *postgres.PostgresStore) *SessionManager {
	return &SessionManager{
		pg: pg,
	}
}

func (s *SessionManager) GetSession(c *fiber.Ctx) (*Session, error) {
	token := c.Cookies("session_token")
	if token == "" {
		return nil, nil
	}

	tokenHash, err := hashSessionToken(token)
	if err != nil {
		return nil, err
	}

	model, err := s.pg.Q.GetSession(c.Context(), tokenHash)
	if err != nil {
		if err == sql.ErrNoRows {
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

func (s *SessionManager) CreateSession(c *fiber.Ctx, userID string, guildIDs []string, accessToken string) error {
	token := generateSessionToken()

	tokenHash, err := hashSessionToken(token)
	if err != nil {
		return err
	}

	_, err = s.pg.Q.InsertSession(c.Context(), postgres.InsertSessionParams{
		TokenHash:   tokenHash,
		UserID:      userID,
		GuildIds:    guildIDs,
		AccessToken: accessToken,
		CreatedAt:   time.Now().UTC(),
		ExpiresAt:   time.Now().UTC().Add(30 * 24 * time.Hour),
	})
	if err != nil {
		return err
	}

	c.Cookie(&fiber.Cookie{
		Name:     "session_token",
		Value:    token,
		HTTPOnly: true,
		Secure:   true,
		SameSite: "strict",
	})

	return nil
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

	return s.pg.Q.DeleteSession(c.Context(), tokenHash)
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

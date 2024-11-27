package session

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base32"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

type Session struct {
	UserID      string
	Guilds      []SessionGuild
	AccessToken string
	CreatedAt   time.Time
	ExpiresAt   time.Time
}

type SessionGuild struct {
	ID          string   `json:"id"`
	UserRoleIDs []string `json:"user_role_ids"`
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
	token := c.Cookies("session_token", c.Get("Authorization"))
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

	var guilds []SessionGuild
	err = json.Unmarshal(model.Guilds, &guilds)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal guilds: %w", err)
	}

	return &Session{
		UserID:      model.UserID,
		Guilds:      guilds,
		AccessToken: model.AccessToken,
		CreatedAt:   model.CreatedAt,
		ExpiresAt:   model.ExpiresAt,
	}, nil
}

func (s *SessionManager) CreateSession(ctx context.Context, session *Session) (string, error) {
	token := generateSessionToken()

	tokenHash, err := hashSessionToken(token)
	if err != nil {
		return "", err
	}

	rawGuilds, err := json.Marshal(session.Guilds)
	if err != nil {
		return "", fmt.Errorf("failed to marshal guilds: %w", err)
	}

	if session.ExpiresAt.IsZero() {
		session.ExpiresAt = session.CreatedAt.Add(30 * 24 * time.Hour)
	}

	_, err = s.pg.Q.InsertSession(ctx, pgmodel.InsertSessionParams{
		TokenHash:   tokenHash,
		UserID:      session.UserID,
		Guilds:      rawGuilds,
		AccessToken: session.AccessToken,
		CreatedAt:   session.CreatedAt,
		ExpiresAt:   session.ExpiresAt,
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

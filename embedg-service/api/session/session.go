package session

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"errors"
	"fmt"
	"slices"
	"strings"
	"time"

	"log/slog"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/ravener/discord-oauth2"
	"golang.org/x/oauth2"
)

// scopeGuildsMembersRead lets us fetch the session user's own member object with their token.
const scopeGuildsMembersRead = "guilds.members.read"

// ScopeGuildsJoin lets us add the user to the support guild. Only requested when they ask for it.
const ScopeGuildsJoin = discord.ScopeGuildsJoin

type Session struct {
	TokenHash      string
	UserID         common.ID
	GuildIDs       []common.ID
	AccessToken    string
	RefreshToken   string
	TokenExpiresAt time.Time
	Scopes         []string
	CreatedAt      time.Time
	ExpiresAt      time.Time
}

type SessionManagerConfig struct {
	InsecureCookies bool
	APIPublicURL    string
	ClientID        string
	ClientSecret    string
}

type SessionManager struct {
	config       SessionManagerConfig
	sessionStore store.SessionStore
	oauth2Config *oauth2.Config
}

func New(config SessionManagerConfig, sessionStore store.SessionStore) *SessionManager {
	return &SessionManager{
		config:       config,
		sessionStore: sessionStore,
		oauth2Config: &oauth2.Config{
			RedirectURL:  fmt.Sprintf("%s/auth/callback", config.APIPublicURL),
			ClientID:     config.ClientID,
			ClientSecret: config.ClientSecret,
			Scopes:       []string{discord.ScopeIdentify, discord.ScopeGuilds, scopeGuildsMembersRead},
			Endpoint:     discord.Endpoint,
		},
	}
}

func (s *SessionManager) OAuth2Config() *oauth2.Config {
	return s.oauth2Config
}

// AuthCodeURL builds the Discord consent URL, with extraScopes on top of the ones every login asks
// for. Asking for more scopes makes Discord show the consent screen again even for returning users.
func (s *SessionManager) AuthCodeURL(state string, extraScopes ...string) string {
	if len(extraScopes) == 0 {
		return s.oauth2Config.AuthCodeURL(state)
	}

	config := *s.oauth2Config
	config.Scopes = append(slices.Clone(config.Scopes), extraScopes...)
	return config.AuthCodeURL(state)
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

	model, err := s.sessionStore.GetSession(c.UserContext(), tokenHash)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &Session{
		TokenHash:      model.TokenHash,
		UserID:         model.UserID,
		GuildIDs:       model.GuildIds,
		AccessToken:    model.AccessToken,
		RefreshToken:   model.RefreshToken,
		TokenExpiresAt: model.TokenExpiresAt,
		Scopes:         model.Scopes,
		CreatedAt:      model.CreatedAt,
		ExpiresAt:      model.ExpiresAt,
	}, nil
}

func (s *SessionManager) CreateSession(ctx context.Context, userID common.ID, guildIDs []common.ID, tokenData *oauth2.Token) (string, error) {
	token := generateSessionToken()

	tokenHash, err := hashSessionToken(token)
	if err != nil {
		return "", err
	}

	err = s.sessionStore.CreateSession(ctx, model.Session{
		TokenHash:      tokenHash,
		UserID:         userID,
		GuildIds:       guildIDs,
		AccessToken:    tokenData.AccessToken,
		RefreshToken:   tokenData.RefreshToken,
		TokenExpiresAt: tokenData.Expiry,
		Scopes:         GrantedScopes(tokenData),
		CreatedAt:      time.Now().UTC(),
		ExpiresAt:      time.Now().UTC().Add(30 * 24 * time.Hour),
	})
	if err != nil {
		return "", err
	}

	return token, nil
}

// ErrSessionInvalid means Discord no longer accepts the session's OAuth token, typically because the
// user revoked the app. The session row is already gone when it's returned; the API maps it to a 401
// so the app sends the user back to log in instead of showing an error.
var ErrSessionInvalid = errors.New("session token is no longer valid")

// UserToken returns a valid access token for the session, refreshing it if it expires within 5 minutes.
func (s *SessionManager) UserToken(ctx context.Context, sess *Session) (string, error) {
	if time.Until(sess.TokenExpiresAt) > 5*time.Minute {
		return sess.AccessToken, nil
	}

	// No access token on purpose: oauth2 only refreshes a token it considers expired, which is 10
	// seconds before expiry, so passing the current one would return it unchanged for most of the
	// window above. We've already decided to refresh, so leave it nothing to reuse.
	tokenData, err := s.oauth2Config.TokenSource(ctx, &oauth2.Token{
		RefreshToken: sess.RefreshToken,
	}).Token()
	if err != nil {
		var retrieveErr *oauth2.RetrieveError
		if errors.As(err, &retrieveErr) && retrieveErr.Response != nil && retrieveErr.Response.StatusCode < 500 {
			// invalid_grant and friends: the refresh token is dead, no retry will bring it back.
			return "", s.InvalidateSession(ctx, sess)
		}
		return "", fmt.Errorf("failed to refresh access token: %w", err)
	}

	err = s.sessionStore.UpdateSessionTokens(ctx, store.UpdateSessionTokensParams{
		TokenHash:      sess.TokenHash,
		AccessToken:    tokenData.AccessToken,
		RefreshToken:   tokenData.RefreshToken,
		TokenExpiresAt: tokenData.Expiry,
	})
	if err != nil {
		return "", fmt.Errorf("failed to store refreshed access token: %w", err)
	}

	sess.AccessToken = tokenData.AccessToken
	sess.RefreshToken = tokenData.RefreshToken
	sess.TokenExpiresAt = tokenData.Expiry

	return tokenData.AccessToken, nil
}

// InvalidateSession deletes the session because Discord rejected its token, and returns
// ErrSessionInvalid for the caller to pass up.
func (s *SessionManager) InvalidateSession(ctx context.Context, sess *Session) error {
	if err := s.sessionStore.DeleteSession(ctx, sess.TokenHash); err != nil {
		slog.Error("Failed to delete session with revoked token", slog.Any("error", err))
	}
	return ErrSessionInvalid
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

	return s.sessionStore.DeleteSession(c.UserContext(), tokenHash)
}

// GrantedScopes reads the scopes Discord actually granted, which can differ from the ones we asked for.
func GrantedScopes(tokenData *oauth2.Token) []string {
	scope, _ := tokenData.Extra("scope").(string)
	return strings.Fields(scope)
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

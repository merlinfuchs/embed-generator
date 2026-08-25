package auth

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/ravener/discord-oauth2"
	"golang.org/x/oauth2"
	"gopkg.in/guregu/null.v4"
)

type AuthHandlerConfig struct {
	APIPublicURL    string
	AppPublicURL    string
	ClientID        string
	ClientSecret    string
	InsecureCookies bool
}

type AuthHandler struct {
	config         AuthHandlerConfig
	userStore      store.UserStore
	sessionManager *session.SessionManager
	oauth2Config   *oauth2.Config
}

func New(config AuthHandlerConfig, userStore store.UserStore, sessionManager *session.SessionManager) *AuthHandler {
	conf := &oauth2.Config{
		RedirectURL:  fmt.Sprintf("%s/auth/callback", config.APIPublicURL),
		ClientID:     config.ClientID,
		ClientSecret: config.ClientSecret,
		Scopes:       []string{discord.ScopeIdentify, discord.ScopeGuilds},
		Endpoint:     discord.Endpoint,
	}

	return &AuthHandler{
		config:         config,
		userStore:      userStore,
		sessionManager: sessionManager,
		oauth2Config:   conf,
	}
}

func (h *AuthHandler) HandleAuthRedirect(c *fiber.Ctx) error {
	state := h.setOauthStateCookie(c)
	h.setOauthRedirectCookie(c)
	return c.Redirect(h.oauth2Config.AuthCodeURL(state), http.StatusTemporaryRedirect)
}

func (h *AuthHandler) HandleAuthCallback(c *fiber.Ctx) error {
	state := h.getOauthStateCookie(c)
	if state == "" || c.Query("state") != state {
		// TODO: redirect to error page
		return h.HandleAuthRedirect(c)
	}

	_, _, err := h.authenticateWithCode(c, c.Query("code"))
	if err != nil {
		// TODO: redirect to error page
		return h.HandleAuthRedirect(c)
	}

	redirectURL := h.getOauthRedirectURL(c)
	return c.Redirect(redirectURL, http.StatusTemporaryRedirect)
}

func (h *AuthHandler) HandleAuthExchange(c *fiber.Ctx, req wire.AuthExchangeRequestWire) error {
	tokenData, token, err := h.authenticateWithCode(c, req.Code)
	if err != nil {
		slog.Error("Failed to authenticate with code", slog.Any("error", err))
		return err
	}

	return c.JSON(wire.AuthExchangeResponseWire{
		Success: true,
		Data: wire.AuthExchangeResponseDataWire{
			AccessToken:  tokenData.AccessToken,
			SessionToken: token,
		},
	})
}

func (h *AuthHandler) HandleAuthLogout(c *fiber.Ctx) error {
	err := h.sessionManager.DeleteSession(c)
	if err != nil {
		return err
	}

	redirectURL := h.config.AppPublicURL

	path := c.Query("redirect")
	if path != "" {
		redirectURL += path
	}

	return c.Redirect(redirectURL, http.StatusTemporaryRedirect)
}

func (h *AuthHandler) authenticateWithCode(c *fiber.Ctx, code string) (*oauth2.Token, string, error) {
	tokenData, err := h.oauth2Config.Exchange(c.Context(), code)
	if err != nil {
		return nil, "", fmt.Errorf("Failed to exchange token: %w", err)
	}

	client := h.oauth2Config.Client(c.Context(), tokenData)
	resp, err := client.Get("https://discord.com/api/users/@me")
	if err != nil {
		return nil, "", h.HandleAuthRedirect(c)
	}

	user := struct {
		ID            common.ID   `json:"id"`
		Username      string      `json:"username"`
		Discriminator string      `json:"discriminator"`
		Avatar        null.String `json:"avatar"`
	}{}
	err = json.NewDecoder(resp.Body).Decode(&user)
	if err != nil {
		return nil, "", fmt.Errorf("Failed to decode user info: %w", err)
	}
	resp.Body.Close()

	err = h.userStore.UpsertUser(c.Context(), model.User{
		ID:            user.ID,
		Name:          user.Username,
		Discriminator: user.Discriminator,
		Avatar:        user.Avatar,
	})
	if err != nil {
		slog.Error("Failed to upsert user", slog.Any("error", err))
		return nil, "", err
	}

	resp, err = client.Get("https://discord.com/api/users/@me/guilds")
	if err != nil {
		slog.Error("Failed to get guilds", slog.Any("error", err))
		return nil, "", fmt.Errorf("Failed to get guilds: %w", err)
	}

	guilds := []struct {
		ID common.ID `json:"id"`
	}{}
	err = json.NewDecoder(resp.Body).Decode(&guilds)
	if err != nil {
		return nil, "", fmt.Errorf("Failed to decode guilds: %w", err)
	}
	resp.Body.Close()

	guildIDs := make([]common.ID, len(guilds))
	for i, guild := range guilds {
		guildIDs[i] = guild.ID
	}

	token, err := h.sessionManager.CreateSession(c.Context(), user.ID, guildIDs, tokenData.AccessToken)
	if err != nil {
		return nil, "", err
	}

	h.sessionManager.CreateSessionCookie(c, token)
	return tokenData, token, nil
}

func (h *AuthHandler) getOauthStateCookie(c *fiber.Ctx) string {
	state := c.Cookies("oauth_state")
	c.ClearCookie("oauth_state")
	return state
}

func (h *AuthHandler) setOauthStateCookie(c *fiber.Ctx) string {
	b := make([]byte, 128)
	rand.Read(b)
	state := base64.URLEncoding.EncodeToString(b)
	c.Cookie(&fiber.Cookie{
		Name:     "oauth_state",
		Value:    state,
		HTTPOnly: true,
		Secure:   h.config.InsecureCookies,
	})
	return state
}

func (h *AuthHandler) getOauthRedirectURL(c *fiber.Ctx) string {
	base := strings.TrimSuffix(h.config.AppPublicURL, "/")
	path := c.Cookies("oauth_redirect")
	c.ClearCookie("oauth_redirect")

	if path == "" {
		return base
	}

	finalURL := base + path
	parsed, err := url.Parse(finalURL)
	if err != nil {
		return base
	}
	baseParsed, err := url.Parse(base)
	if err != nil {
		return base
	}

	// Ensure redirect stays on the same origin (scheme + host).
	if parsed.Host != baseParsed.Host || parsed.Scheme != baseParsed.Scheme {
		return base
	}

	return finalURL
}

func (h *AuthHandler) setOauthRedirectCookie(c *fiber.Ctx) {
	redirectURL := c.Query("redirect")
	if redirectURL != "" {
		c.Cookie(&fiber.Cookie{
			Name:     "oauth_redirect",
			Value:    redirectURL,
			HTTPOnly: true,
			Secure:   !h.config.InsecureCookies,
		})
	} else {
		c.ClearCookie("oauth_redirect")
	}
}

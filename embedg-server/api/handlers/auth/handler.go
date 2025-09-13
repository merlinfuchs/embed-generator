package auth

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/rest"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/ravener/discord-oauth2"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"golang.org/x/oauth2"
)

type AuthHandler struct {
	rest           rest.RestClient
	pg             *postgres.PostgresStore
	sessionManager *session.SessionManager
	oauth2Config   *oauth2.Config
}

func New(rest rest.RestClient, pg *postgres.PostgresStore, sessionManager *session.SessionManager) *AuthHandler {
	conf := &oauth2.Config{
		RedirectURL:  fmt.Sprintf("%s/auth/callback", viper.GetString("api.public_url")),
		ClientID:     viper.GetString("discord.client_id"),
		ClientSecret: viper.GetString("discord.client_secret"),
		Scopes:       []string{discord.ScopeIdentify, discord.ScopeGuilds},
		Endpoint:     discord.Endpoint,
	}

	return &AuthHandler{
		rest:           rest,
		pg:             pg,
		sessionManager: sessionManager,
		oauth2Config:   conf,
	}
}

func (h *AuthHandler) HandleAuthRedirect(c *fiber.Ctx) error {
	state := setOauthStateCookie(c)
	setOauthRedirectCookie(c)
	return c.Redirect(h.oauth2Config.AuthCodeURL(state), http.StatusTemporaryRedirect)
}

func (h *AuthHandler) HandleAuthCallback(c *fiber.Ctx) error {
	state := getOauthStateCookie(c)
	if state == "" || c.Query("state") != state {
		log.Error().Msg("Failed to login: Invalid state")
		// TODO: redirect to error page
		return h.HandleAuthRedirect(c)
	}

	_, _, err := h.authenticateWithCode(c, c.Query("code"))
	if err != nil {
		log.Error().Err(err).Msg("Failed to authenticate with code")
		// TODO: redirect to error page
		return h.HandleAuthRedirect(c)
	}

	redirectURL := getOauthRedirectURL(c)
	return c.Redirect(redirectURL, http.StatusTemporaryRedirect)
}

func (h *AuthHandler) HandleAuthExchange(c *fiber.Ctx, req wire.AuthExchangeRequestWire) error {
	tokenData, token, err := h.authenticateWithCode(c, req.Code)
	if err != nil {
		log.Error().Err(err).Msg("Failed to authenticate with code")
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

	redirectURL := viper.GetString("app.public_url")

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

	user, err := h.rest.OauthUser(c.Context(), tokenData.AccessToken)
	if err != nil {
		return nil, "", h.HandleAuthRedirect(c)
	}

	_, err = h.pg.Q.UpsertUser(c.Context(), pgmodel.UpsertUserParams{
		ID:            user.ID,
		Name:          user.Username,
		Discriminator: user.Discriminator,
		Avatar:        sql.NullString{String: user.Avatar, Valid: user.Avatar != ""},
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to upsert user")
		return nil, "", err
	}

	token, err := h.sessionManager.CreateSession(c.Context(), user.ID, tokenData.AccessToken, tokenData.Expiry)
	if err != nil {
		return nil, "", err
	}

	h.sessionManager.CreateSessionCookie(c, token)
	return tokenData, token, nil
}

func getOauthStateCookie(c *fiber.Ctx) string {
	state := c.Cookies("oauth_state")
	c.ClearCookie("oauth_state")
	return state
}

func setOauthStateCookie(c *fiber.Ctx) string {
	b := make([]byte, 128)
	rand.Read(b)
	state := base64.URLEncoding.EncodeToString(b)
	c.Cookie(&fiber.Cookie{
		Name:     "oauth_state",
		Value:    state,
		HTTPOnly: true,
		Secure:   !viper.GetBool("api.insecure_cookies"),
	})
	return state
}

func getOauthRedirectURL(c *fiber.Ctx) string {
	redirectURL := viper.GetString("app.public_url")

	path := c.Cookies("oauth_redirect")
	if path != "" {
		redirectURL += path
	}

	c.ClearCookie("oauth_redirect")
	return redirectURL
}

func setOauthRedirectCookie(c *fiber.Ctx) {
	redirectURL := c.Query("redirect")
	if redirectURL != "" {
		c.Cookie(&fiber.Cookie{
			Name:     "oauth_redirect",
			Value:    redirectURL,
			HTTPOnly: true,
			Secure:   !viper.GetBool("api.insecure_cookies"),
		})
	} else {
		c.ClearCookie("oauth_redirect")
	}
}

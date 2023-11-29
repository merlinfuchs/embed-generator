package auth

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/ravener/discord-oauth2"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"golang.org/x/oauth2"
	"gopkg.in/guregu/null.v4"
)

type AuthHandler struct {
	pg             *postgres.PostgresStore
	bot            *bot.Bot
	sessionManager *session.SessionManager
	oauth2Config   *oauth2.Config
}

func New(pg *postgres.PostgresStore, bot *bot.Bot, sessionManager *session.SessionManager) *AuthHandler {
	conf := &oauth2.Config{
		RedirectURL:  fmt.Sprintf("%s/auth/callback", viper.GetString("api.public_url")),
		ClientID:     viper.GetString("discord.client_id"),
		ClientSecret: viper.GetString("discord.client_secret"),
		Scopes:       []string{discord.ScopeIdentify, discord.ScopeGuilds},
		Endpoint:     discord.Endpoint,
	}

	return &AuthHandler{
		pg:             pg,
		bot:            bot,
		sessionManager: sessionManager,
		oauth2Config:   conf,
	}
}

func (h *AuthHandler) HandleAuthRedirect(c *fiber.Ctx) error {
	state := setOauthStateCookie(c)
	return c.Redirect(h.oauth2Config.AuthCodeURL(state), http.StatusTemporaryRedirect)
}

func (h *AuthHandler) HandleAuthCallback(c *fiber.Ctx) error {
	state := getOauthStateCookie(c)
	if state == "" || c.Query("state") != state {
		log.Error().Msg("Failed to login: Invalid state")
		// TODO: redirect to error page
		return h.HandleAuthRedirect(c)
	}

	token, err := h.oauth2Config.Exchange(c.Context(), c.Query("code"))
	if err != nil {
		log.Error().Err(err).Msg("Failed to exchange token")
		// TODO: redirect to error page
		return h.HandleAuthRedirect(c)
	}

	client := h.oauth2Config.Client(c.Context(), token)
	resp, err := client.Get("https://discord.com/api/users/@me")
	if err != nil {
		log.Error().Err(err).Msg("Failed to get user info")
		// TODO: redirect to error page
		return h.HandleAuthRedirect(c)
	}

	user := struct {
		ID            string      `json:"id"`
		Username      string      `json:"username"`
		Discriminator string      `json:"discriminator"`
		Avatar        null.String `json:"avatar"`
	}{}
	err = json.NewDecoder(resp.Body).Decode(&user)
	if err != nil {
		log.Error().Err(err).Msg("Failed to decode user info")
		// TODO: redirect to error page
		return h.HandleAuthRedirect(c)
	}
	resp.Body.Close()

	_, err = h.pg.Q.UpsertUser(c.Context(), postgres.UpsertUserParams{
		ID:            user.ID,
		Name:          user.Username,
		Discriminator: user.Discriminator,
		Avatar:        sql.NullString{String: user.Avatar.String, Valid: user.Avatar.Valid},
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to upsert user")
		return err
	}

	resp, err = client.Get("https://discord.com/api/users/@me/guilds")
	if err != nil {
		log.Error().Err(err).Msg("Failed to get guilds")
		// TODO: redirect to error page
		return h.HandleAuthRedirect(c)
	}

	guilds := []struct {
		ID string `json:"id"`
	}{}
	err = json.NewDecoder(resp.Body).Decode(&guilds)
	if err != nil {
		log.Error().Err(err).Msg("Failed to decode guilds")
		// TODO: redirect to error page
		return h.HandleAuthRedirect(c)
	}
	resp.Body.Close()

	guildIDs := make([]string, len(guilds))
	for i, guild := range guilds {
		guildIDs[i] = guild.ID
	}

	err = h.sessionManager.CreateSessionCookie(c, user.ID, guildIDs, token.AccessToken)
	if err != nil {
		return err
	}

	return c.Redirect(viper.GetString("app.public_url"), http.StatusTemporaryRedirect)
}

func (h *AuthHandler) HandleAuthLogout(c *fiber.Ctx) error {
	err := h.sessionManager.DeleteSession(c)
	if err != nil {
		return err
	}

	return c.Redirect(viper.GetString("app.public_url"), http.StatusTemporaryRedirect)
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
		Secure:   true,
	})
	return state
}

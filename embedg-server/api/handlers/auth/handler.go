package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
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
		Scopes:       []string{discord.ScopeIdentify, discord.ScopeGuilds, "guilds.members.read"},
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
		return nil, "", fmt.Errorf("failed to exchange token: %w", err)
	}

	client := h.oauth2Config.Client(c.Context(), tokenData)
	resp, err := client.Get("https://discord.com/api/users/@me")
	if err != nil {
		return nil, "", h.HandleAuthRedirect(c)
	}

	user := struct {
		ID            string      `json:"id"`
		Username      string      `json:"username"`
		Discriminator string      `json:"discriminator"`
		Avatar        null.String `json:"avatar"`
	}{}
	err = json.NewDecoder(resp.Body).Decode(&user)
	if err != nil {
		return nil, "", fmt.Errorf("failed to decode user info: %w", err)
	}
	resp.Body.Close()

	_, err = h.pg.Q.UpsertUser(c.Context(), pgmodel.UpsertUserParams{
		ID:            user.ID,
		Name:          user.Username,
		Discriminator: user.Discriminator,
		Avatar:        sql.NullString{String: user.Avatar.String, Valid: user.Avatar.Valid},
	})
	if err != nil {
		log.Error().Err(err).
			Str("user_id", user.ID).
			Msg("Failed to upsert user")
		return nil, "", err
	}

	guilds, err := getOauthGuilds(c.Context(), client)
	if err != nil {
		log.Error().Err(err).
			Str("user_id", user.ID).
			Msg("Failed to get guilds")
		return nil, "", fmt.Errorf("failed to get guilds: %w", err)
	}

	if err := populateOauthGuildRoleIDs(c.Context(), client, guilds); err != nil {
		log.Error().Err(err).
			Str("user_id", user.ID).
			Msg("Failed to populate guild role IDs")
		return nil, "", err
	}

	token, err := h.sessionManager.CreateSession(c.Context(), &session.Session{
		UserID:      user.ID,
		Guilds:      guilds,
		AccessToken: tokenData.AccessToken,
		CreatedAt:   time.Now().UTC(),
	})
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

func getOauthGuilds(ctx context.Context, client *http.Client) ([]session.SessionGuild, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://discord.com/api/users/@me/guilds", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get guilds: %w", err)
	}
	defer resp.Body.Close()

	guildIDs := []struct {
		ID string `json:"id"`
	}{}
	err = json.NewDecoder(resp.Body).Decode(&guildIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to decode guilds: %w", err)
	}

	guilds := make([]session.SessionGuild, len(guildIDs))
	for i, g := range guildIDs {
		guilds[i] = session.SessionGuild{
			ID: g.ID,
		}
	}

	return guilds, nil
}

func populateOauthGuildRoleIDs(ctx context.Context, client *http.Client, guilds []session.SessionGuild) error {
	var wg sync.WaitGroup
	errChan := make(chan error, len(guilds))

	for i, guild := range guilds {
		wg.Add(1)

		go func(i int, guild session.SessionGuild) {
			defer wg.Done()

			req, err := http.NewRequestWithContext(
				ctx,
				"GET",
				fmt.Sprintf("https://discord.com/api/users/@me/guilds/%s/member", guild.ID),
				nil,
			)
			if err != nil {
				log.Error().Err(err).
					Str("guild_id", guild.ID).
					Msg("Failed to create request")
				errChan <- fmt.Errorf("failed to create request: %w", err)
				return
			}

			resp, err := client.Do(req)
			if err != nil {
				log.Error().Err(err).
					Str("guild_id", guild.ID).
					Msg("Failed to get guild member")
				errChan <- fmt.Errorf("failed to get guild member: %w", err)
				return
			}
			defer resp.Body.Close()

			member := struct {
				Roles []string `json:"roles"`
			}{}
			err = json.NewDecoder(resp.Body).Decode(&member)
			if err != nil {
				log.Error().Err(err).
					Str("guild_id", guild.ID).
					Msg("Failed to decode guild member")
				errChan <- fmt.Errorf("failed to decode guild member: %w", err)
				return
			}

			guilds[i].UserRoleIDs = member.Roles
		}(i, guild)
	}

	wg.Wait()
	close(errChan)

	if err := <-errChan; err != nil {
		return err
	}

	return nil
}

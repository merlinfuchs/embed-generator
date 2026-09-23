package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"golang.org/x/oauth2"
	"gopkg.in/guregu/null.v4"
)

type AuthHandlerConfig struct {
	AppPublicURL    string
	InsecureCookies bool
	SupportGuildID  common.ID
}

type AuthHandler struct {
	config         AuthHandlerConfig
	userStore      store.UserStore
	sessionManager *session.SessionManager
	oauth2Config   *oauth2.Config
	rest           rest.Rest
}

func New(config AuthHandlerConfig, userStore store.UserStore, sessionManager *session.SessionManager, restClient rest.Rest) *AuthHandler {
	return &AuthHandler{
		config:         config,
		userStore:      userStore,
		sessionManager: sessionManager,
		oauth2Config:   sessionManager.OAuth2Config(),
		rest:           restClient,
	}
}

func (h *AuthHandler) HandleAuthRedirect(c *fiber.Ctx) error {
	state := h.setOauthStateCookie(c)
	h.setOauthRedirectCookie(c)

	// Whether the user is added to the support guild in the callback follows from the scope
	// Discord grants, so nothing about this choice has to survive the redirect.
	var extraScopes []string
	if c.Query("join_support") == "true" {
		extraScopes = []string{session.ScopeGuildsJoin}
	}

	return c.Redirect(h.sessionManager.AuthCodeURL(state, extraScopes...), http.StatusTemporaryRedirect)
}

func (h *AuthHandler) HandleAuthCallback(c *fiber.Ctx) error {
	state := h.getOauthStateCookie(c)

	// Discord redirects back with an error instead of a code when the user cancels the flow
	if errorCode := c.Query("error"); errorCode != "" {
		slog.Debug(
			"Discord OAuth2 flow was aborted",
			slog.String("error", errorCode),
			slog.String("error_description", c.Query("error_description")),
		)
		return h.redirectWithLoginError(c, errorCode)
	}

	if state == "" || c.Query("state") != state {
		slog.Error("Failed to login: Invalid state")
		return h.redirectWithLoginError(c, "invalid_state")
	}

	err := h.authenticateWithCode(c, c.Query("code"))
	if err != nil {
		slog.Error("Failed to authenticate with code", slog.Any("error", err))
		return h.redirectWithLoginError(c, "server_error")
	}

	redirectURL := h.getOauthRedirectURL(c)
	return c.Redirect(redirectURL, http.StatusTemporaryRedirect)
}

// redirectWithLoginError sends the user back to where they started the login flow
// without creating a session, so the app can show an error message.
func (h *AuthHandler) redirectWithLoginError(c *fiber.Ctx, errorCode string) error {
	redirectURL, err := url.Parse(h.getOauthRedirectURL(c))
	if err != nil {
		return c.Redirect(h.config.AppPublicURL, http.StatusTemporaryRedirect)
	}

	query := redirectURL.Query()
	query.Set("login_error", errorCode)
	redirectURL.RawQuery = query.Encode()

	return c.Redirect(redirectURL.String(), http.StatusTemporaryRedirect)
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

func (h *AuthHandler) authenticateWithCode(c *fiber.Ctx, code string) error {
	tokenData, err := h.oauth2Config.Exchange(c.UserContext(), code)
	if err != nil {
		return fmt.Errorf("Failed to exchange token: %w", err)
	}

	client := h.oauth2Config.Client(c.UserContext(), tokenData)
	resp, err := client.Get("https://discord.com/api/users/@me")
	if err != nil {
		return fmt.Errorf("Failed to get user info: %w", err)
	}

	user := struct {
		ID            common.ID   `json:"id"`
		Username      string      `json:"username"`
		Discriminator string      `json:"discriminator"`
		Avatar        null.String `json:"avatar"`
	}{}
	err = json.NewDecoder(resp.Body).Decode(&user)
	if err != nil {
		return fmt.Errorf("Failed to decode user info: %w", err)
	}
	resp.Body.Close()

	err = h.userStore.UpsertUser(c.UserContext(), model.User{
		ID:            user.ID,
		Name:          user.Username,
		Discriminator: user.Discriminator,
		Avatar:        user.Avatar,
	})
	if err != nil {
		slog.Error("Failed to upsert user", slog.Any("error", err))
		return err
	}

	resp, err = client.Get("https://discord.com/api/users/@me/guilds")
	if err != nil {
		slog.Error("Failed to get guilds", slog.Any("error", err))
		return fmt.Errorf("Failed to get guilds: %w", err)
	}

	guilds := []struct {
		ID common.ID `json:"id"`
	}{}
	err = json.NewDecoder(resp.Body).Decode(&guilds)
	if err != nil {
		return fmt.Errorf("Failed to decode guilds: %w", err)
	}
	resp.Body.Close()

	guildIDs := make([]common.ID, len(guilds))
	for i, guild := range guilds {
		guildIDs[i] = guild.ID
	}

	token, err := h.sessionManager.CreateSession(c.UserContext(), user.ID, guildIDs, tokenData)
	if err != nil {
		return err
	}

	h.sessionManager.CreateSessionCookie(c, token)

	h.joinSupportGuild(c.UserContext(), user.ID, tokenData)
	return nil
}

// joinSupportGuild adds the user to the support guild after they ticked the box on the login
// prompt. Best effort: a failed join shouldn't keep them from logging in.
func (h *AuthHandler) joinSupportGuild(ctx context.Context, userID common.ID, tokenData *oauth2.Token) {
	if h.config.SupportGuildID == 0 || !session.HasScope(tokenData, session.ScopeGuildsJoin) {
		return
	}

	// Every join targets the same guild, so they all queue behind one rate limit bucket while the
	// user waits on the login redirect. Give up rather than hold the redirect open for a burst.
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Passing no response body on purpose: Discord answers 204 when the user is already a member,
	// which the typed AddMember would fail to unmarshal.
	err := h.rest.Do(
		rest.AddMember.Compile(nil, h.config.SupportGuildID, userID),
		discord.MemberAdd{AccessToken: tokenData.AccessToken},
		nil,
		rest.WithCtx(ctx),
	)
	if err != nil {
		slog.Error(
			"Failed to add user to the support guild",
			slog.String("user_id", userID.String()),
			slog.Any("error", err),
		)
	}
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
		Secure:   !h.config.InsecureCookies,
		// Lax, not strict: the callback is a cross site navigation from Discord, and a strict
		// cookie wouldn't be sent with it.
		SameSite: "lax",
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
			SameSite: "lax",
		})
	} else {
		c.ClearCookie("oauth_redirect")
	}
}

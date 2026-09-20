package session

import (
	"log/slog"
	"slices"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
)

type SessionMiddleware struct {
	manager *SessionManager
}

func NewSessionMiddleware(manager *SessionManager) *SessionMiddleware {
	return &SessionMiddleware{
		manager: manager,
	}
}

func (m *SessionMiddleware) SessionRequired() func(c *fiber.Ctx) error {
	return func(c *fiber.Ctx) error {
		session, err := m.manager.GetSession(c)
		if err != nil {
			return err
		}

		if session == nil {
			return handlers.Unauthorized("invalid_session", "No valid session, perhaps it expired, try logging in again.")
		}

		// Without this scope we can't read the user's own member, so every permission check would
		// fail with an opaque error from Discord instead of sending them back to log in.
		if !slices.Contains(session.Scopes, scopeGuildsMembersRead) {
			return handlers.Unauthorized("scope_missing", "Your session is missing a permission, try logging in again.")
		}

		c.Locals("session", session)

		return c.Next()
	}
}

func (m *SessionMiddleware) SessionOptional() func(c *fiber.Ctx) error {
	return func(c *fiber.Ctx) error {
		session, err := m.manager.GetSession(c)
		if err != nil {
			slog.Error("Failed to validate session", slog.Any("error", err))
		}

		c.Locals("session", session)

		return c.Next()
	}
}

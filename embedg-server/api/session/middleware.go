package session

import (
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/rs/zerolog/log"
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
			return helpers.Unauthorized("invalid_session", "No valid session, perhaps it expired, try logging in again.")
		}

		c.Locals("session", session)

		return c.Next()
	}
}

func (m *SessionMiddleware) SessionOptional() func(c *fiber.Ctx) error {
	return func(c *fiber.Ctx) error {
		session, err := m.manager.GetSession(c)
		if err != nil {
			log.Error().Err(err).Msg("Failed to validate session")
		}

		c.Locals("session", session)

		return c.Next()
	}
}

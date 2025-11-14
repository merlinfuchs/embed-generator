package access

import (
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
)

func (m *AccessManager) CheckGuildAccessForRequest(c *fiber.Ctx, guildID common.ID) error {
	session := c.Locals("session").(*session.Session)

	access, err := m.GetGuildAccessForUser(session.UserID, guildID)
	if err != nil {
		return err
	}

	if !access.HasChannelWithBotAccess {
		return handlers.Forbidden("bot_missing_access", "The bot doesn't have access to this guild")
	}

	if !access.HasChannelWithUserAccess {
		return handlers.Forbidden("missing_access", "You don't have access to this guild")
	}

	return nil
}

func (m *AccessManager) CheckChannelAccessForRequest(c *fiber.Ctx, channelID common.ID) error {
	session := c.Locals("session").(*session.Session)

	access, err := m.GetChannelAccessForUser(session.UserID, channelID)
	if err != nil {
		return err
	}

	if !access.BotAccess() {
		return handlers.Forbidden("bot_missing_access", "The bot doesn't have access to this channel")
	}

	if !access.UserAccess() {
		return handlers.Forbidden("missing_access", "You don't have access to this channel")
	}

	return nil
}

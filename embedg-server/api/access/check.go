package access

import (
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
)

func (m *AccessManager) CheckChannelAccess(c *fiber.Ctx, channelID string) error {
	session := c.Locals("session").(*session.Session)

	access, err := m.GetChannelAccess(c.Context(), session.UserID, channelID)
	if err != nil {
		return err
	}

	if !access.BotAccess() {
		return helpers.Forbidden("bot_missing_access", "The bot doesn't have access to this channel")
	}

	if !access.UserAccess() {
		return helpers.Forbidden("missing_access", "You don't have access to this channel")
	}

	return nil
}

func (m *AccessManager) CheckUserInGuild(c *fiber.Ctx, guildID string) error {
	session := c.Locals("session").(*session.Session)

	access, err := m.OauthUserInGuild(c.Context(), session.AccessToken, guildID)
	if err != nil {
		return err
	}

	if !access {
		return helpers.Forbidden("missing_access", "You don't have access to this guild.")
	}

	return nil
}

func (m *AccessManager) CheckUserGuildAccess(c *fiber.Ctx, guildID string) error {
	session := c.Locals("session").(*session.Session)

	perms, err := m.OauthUserGuildPermissions(c.Context(), session.AccessToken, guildID)
	if err != nil {
		return err
	}

	if perms&(discordgo.PermissionManageWebhooks|discordgo.PermissionAdministrator) == 0 {
		return helpers.Forbidden("missing_access", "You don't have access to this guild.")
	}

	return nil
}

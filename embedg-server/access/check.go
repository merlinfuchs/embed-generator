package access

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

func (m *AccessManager) CheckGuildAccessForRequest(c *fiber.Ctx, guildID common.ID) error {
	session := c.Locals("session").(*session.Session)

	access, err := m.GetGuildAccessForSession(c.UserContext(), session, guildID)
	if err != nil {
		return err
	}

	if !access.HasChannelWithBotAccess() {
		if !access.BotInGuild {
			return handlers.Forbidden("bot_missing_access", "The bot isn't in this server.")
		}
		return handlers.Forbidden("bot_missing_access", "The bot needs "+requiredPermissionsName+" in at least one channel of this server.")
	}

	if !access.HasChannelWithUserAccess() {
		if !access.UserInGuild {
			return handlers.Forbidden("missing_access", "You aren't a member of this server.")
		}
		return handlers.Forbidden("missing_access", "You need "+requiredPermissionsName+" in at least one channel of this server.")
	}

	return nil
}

func (m *AccessManager) CheckChannelAccessForRequest(c *fiber.Ctx, channelID common.ID) error {
	session := c.Locals("session").(*session.Session)

	access, err := m.GetChannelAccessForSession(c.UserContext(), session, channelID)
	if err != nil {
		return err
	}

	if !access.BotAccess() {
		return handlers.Forbidden("bot_missing_access", "The bot needs "+requiredPermissionsName+" in this channel.")
	}

	if !access.UserAccess() {
		return handlers.Forbidden("missing_access", "You need "+requiredPermissionsName+" in this channel.")
	}

	return nil
}

// CheckChannelAccessForRequestInGuild is CheckChannelAccessForRequest for endpoints that carry a
// guild id alongside the channel. Checking the two separately lets a caller pair a guild they
// have access to with a channel in an entirely different one: the row is then stored under, and
// billed to, the wrong guild, and the guild it actually posts in never sees it in its dashboard.
func (m *AccessManager) CheckChannelAccessForRequestInGuild(c *fiber.Ctx, channelID common.ID, guildID common.ID) error {
	channel, err := m.guildState.Channel(c.UserContext(), channelID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("unknown_channel", "The channel does not exist.")
		}
		return err
	}

	if channel.GuildID() != guildID {
		return handlers.BadRequest("channel_guild_mismatch", "The channel doesn't belong to this server.")
	}

	return m.CheckChannelAccessForRequest(c, channelID)
}

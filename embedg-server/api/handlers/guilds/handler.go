package guilds

import (
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"gopkg.in/guregu/null.v4"
)

type GuildsHanlder struct {
	pg  *postgres.PostgresStore
	bot *bot.Bot
}

func New(pg *postgres.PostgresStore, bot *bot.Bot) *GuildsHanlder {
	return &GuildsHanlder{
		pg:  pg,
		bot: bot,
	}
}

func (h *GuildsHanlder) HandleListGuilds(c *fiber.Ctx) error {
	guilds := h.bot.State.Guilds

	res := make([]wire.GuildWire, len(guilds))
	for i, guild := range guilds {
		res[i] = wire.GuildWire{
			ID:                  guild.ID,
			Name:                guild.Name,
			Icon:                null.NewString(guild.Icon, guild.Icon != ""),
			BotSendPermissions:  true,
			UserSendPermissions: true,
		}
	}

	return c.JSON(res)
}

func (h *GuildsHanlder) HandleListGuildChannels(c *fiber.Ctx) error {
	guildID := c.Params("guildID")
	guild, err := h.bot.State.Guild(guildID)
	if err != nil {
		return err
	}

	if guild == nil {
		return helpers.NotFound("unknown_guild", "The guild does not exist.")
	}

	res := make([]wire.GuildChannelWire, len(guild.Channels))
	for i, channel := range guild.Channels {
		res[i] = wire.GuildChannelWire{
			ID:                  channel.ID,
			Name:                channel.Name,
			Position:            channel.Position,
			ParentID:            null.NewString(channel.ParentID, channel.ParentID != ""),
			Type:                int(channel.Type),
			BotSendPermissions:  true,
			UserSendPermissions: true,
		}
	}

	return c.JSON(res)
}

func (h *GuildsHanlder) HandleListGuildRoles(c *fiber.Ctx) error {
	guildID := c.Params("guildID")
	guild, err := h.bot.State.Guild(guildID)
	if err != nil {
		return err
	}

	if guild == nil {
		return helpers.NotFound("unknown_guild", "The guild does not exist.")
	}

	res := make([]wire.GuildRoleWire, len(guild.Roles))
	for i, role := range guild.Roles {
		res[i] = wire.GuildRoleWire{
			ID:      role.ID,
			Name:    role.Name,
			Managed: role.Managed,
		}
	}

	return c.JSON(res)
}

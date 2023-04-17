package guilds

import (
	"fmt"

	"github.com/bwmarrin/discordgo"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"gopkg.in/guregu/null.v4"
)

type GuildsHanlder struct {
	pg  *postgres.PostgresStore
	bot *bot.Bot
	am  *access.AccessManager
}

func New(pg *postgres.PostgresStore, bot *bot.Bot, am *access.AccessManager) *GuildsHanlder {
	return &GuildsHanlder{
		pg:  pg,
		bot: bot,
		am:  am,
	}
}

func (h *GuildsHanlder) HandleListGuilds(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)

	res := make([]wire.GuildWire, 0)
	for _, guildID := range session.GuildIDs {
		guild, err := h.bot.State.Guild(guildID)
		if err != nil {
			if err == discordgo.ErrStateNotFound {
				continue
			}
			return err
		}

		access, err := h.am.GetGuildAccessForUser(session.UserID, guild.ID)
		if err != nil {
			log.Error().Err(err).Msg("Failed to check guild access")
			return err
		}

		res = append(res, wire.GuildWire{
			ID:                       guild.ID,
			Name:                     guild.Name,
			Icon:                     null.NewString(guild.Icon, guild.Icon != ""),
			HasChannelWithUserAccess: access.HasChannelWithUserAccess,
			HasChannelWithBotAccess:  access.HasChannelWithBotAccess,
		})
	}

	return c.JSON(res)
}

func (h *GuildsHanlder) HandleGetGuild(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	guildID := c.Params("guildID")

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	guild, err := h.bot.State.Guild(guildID)
	if err != nil {
		if err == discordgo.ErrStateNotFound {
			return helpers.NotFound("unknown_guild", "The guild does not exist.")
		}
		return err
	}

	access, err := h.am.GetGuildAccessForUser(session.UserID, guild.ID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to check guild access")
		return err
	}

	res := wire.GuildWire{
		ID:                       guild.ID,
		Name:                     guild.Name,
		Icon:                     null.NewString(guild.Icon, guild.Icon != ""),
		HasChannelWithUserAccess: access.HasChannelWithUserAccess,
		HasChannelWithBotAccess:  access.HasChannelWithBotAccess,
	}

	return c.JSON(res)
}

func (h *GuildsHanlder) HandleListGuildChannels(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	guildID := c.Params("guildID")

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	guild, err := h.bot.State.Guild(guildID)
	if err != nil {
		if err == discordgo.ErrStateNotFound {
			return helpers.NotFound("unknown_guild", "The guild does not exist.")
		}
		return err
	}

	res := make([]wire.GuildChannelWire, len(guild.Channels))
	for i, channel := range guild.Channels {
		access, err := h.am.GetChannelAccessForUser(session.UserID, channel.ID)
		if err != nil {
			log.Error().Err(err).Msg("Failed to check channel access")
			return err
		}

		res[i] = wire.GuildChannelWire{
			ID:              channel.ID,
			Name:            channel.Name,
			Position:        channel.Position,
			ParentID:        null.NewString(channel.ParentID, channel.ParentID != ""),
			Type:            int(channel.Type),
			UserAccess:      access.UserAccess(),
			UserPermissions: fmt.Sprintf("%d", access.UserPermissions),
			BotAccess:       access.BotAccess(),
			BotPermissions:  fmt.Sprintf("%d", access.BotPermissions),
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

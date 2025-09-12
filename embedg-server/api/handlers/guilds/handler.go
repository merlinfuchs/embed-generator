package guilds

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/rest"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"gopkg.in/guregu/null.v4"
)

type GuildsHanlder struct {
	pg        *postgres.PostgresStore
	bot       *bot.Bot
	am        *access.AccessManager
	planStore store.PlanStore
}

func New(
	pg *postgres.PostgresStore,
	bot *bot.Bot,
	am *access.AccessManager,
	planStore store.PlanStore,
) *GuildsHanlder {
	return &GuildsHanlder{
		pg:        pg,
		bot:       bot,
		am:        am,
		planStore: planStore,
	}
}

func (h *GuildsHanlder) HandleListGuilds(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)

	guilds, err := h.bot.Rest.OauthUserGuilds(c.Context(), session.AccessToken)
	if err != nil {
		return fmt.Errorf("Failed to get oauth user guilds: %w", err)
	}

	res := make([]wire.GuildWire, 0, len(guilds))
	for _, guild := range guilds {
		if !h.bot.State.HasGuild(guild.ID) {
			continue
		}

		res = append(res, wire.GuildWire{
			ID:                       guild.ID,
			Name:                     guild.Name,
			Icon:                     null.NewString(guild.Icon, guild.Icon != ""),
			HasChannelWithUserAccess: true,
			HasChannelWithBotAccess:  true,
		})
	}

	return c.JSON(wire.ListGuildsResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *GuildsHanlder) HandleGetGuild(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	guildID := c.Params("guildID")

	guild, err := h.bot.Rest.OauthUserGuild(c.Context(), session.AccessToken, guildID)
	if err != nil {
		if errors.Is(err, rest.ErrNotFound) {
			return helpers.NotFound("unknown_guild", "The guild does not exist or the bot is missing access.")
		}
		return err
	}

	res := wire.GuildWire{
		ID:                       guild.ID,
		Name:                     guild.Name,
		Icon:                     null.NewString(guild.Icon, guild.Icon != ""),
		HasChannelWithUserAccess: true,
		HasChannelWithBotAccess:  true,
	}

	return c.JSON(wire.GetGuildResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *GuildsHanlder) HandleListGuildChannels(c *fiber.Ctx) error {
	guildID := c.Params("guildID")

	if err := h.am.CheckUserInGuild(c, guildID); err != nil {
		return err
	}

	channels, err := h.bot.Rest.GuildChannels(c.Context(), guildID)
	if err != nil {
		if errors.Is(err, rest.ErrNotFound) {
			return helpers.NotFound("unknown_guild", "The guild does not exist or the bot is missing access.")
		}
		return err
	}

	threads, err := h.bot.Rest.GuildThreads(c.Context(), guildID)
	if err != nil {
		if errors.Is(err, rest.ErrNotFound) {
			return helpers.NotFound("unknown_guild", "The guild does not exist or the bot is missing access.")
		}
		return err
	}

	res := make([]wire.GuildChannelWire, 0, len(channels))

	for _, channel := range channels {
		res = append(res, wire.GuildChannelWire{
			ID:              channel.ID,
			Name:            channel.Name,
			Position:        channel.Position,
			ParentID:        null.NewString(channel.ParentID, channel.ParentID != ""),
			Type:            int(channel.Type),
			UserAccess:      true,
			UserPermissions: fmt.Sprintf("%d", 0),
			BotAccess:       true,
			BotPermissions:  fmt.Sprintf("%d", 0),
		})
	}

	for _, channel := range threads {
		res = append(res, wire.GuildChannelWire{
			ID:              channel.ID,
			Name:            channel.Name,
			Position:        channel.Position,
			ParentID:        null.NewString(channel.ParentID, channel.ParentID != ""),
			Type:            int(channel.Type),
			UserAccess:      true,
			UserPermissions: fmt.Sprintf("%d", 0),
			BotAccess:       true,
			BotPermissions:  fmt.Sprintf("%d", 0),
		})
	}

	return c.JSON(wire.ListChannelsResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *GuildsHanlder) HandleListGuildRoles(c *fiber.Ctx) error {
	guildID := c.Params("guildID")
	if err := h.am.CheckUserInGuild(c, guildID); err != nil {
		return err
	}

	roles, err := h.bot.Rest.GuildRoles(c.Context(), guildID)
	if err != nil {
		if errors.Is(err, rest.ErrNotFound) {
			return helpers.NotFound("unknown_guild", "The guild does not exist or the bot is missing access.")
		}
		return err
	}

	res := make([]wire.GuildRoleWire, 0, len(roles))
	for _, role := range roles {
		res = append(res, wire.GuildRoleWire{
			ID:       role.ID,
			Name:     role.Name,
			Managed:  role.Managed,
			Color:    role.Color,
			Position: role.Position,
		})
	}

	return c.JSON(wire.ListRolesResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *GuildsHanlder) HandleListGuildEmojis(c *fiber.Ctx) error {
	guildID := c.Params("guildID")
	if err := h.am.CheckUserInGuild(c, guildID); err != nil {
		return err
	}

	guild, err := h.bot.Rest.Guild(c.Context(), guildID)
	if err != nil {
		if errors.Is(err, rest.ErrNotFound) {
			return helpers.NotFound("unknown_guild", "The guild does not exist or the bot is missing access.")
		}
		return err
	}

	res := make([]wire.GuildEmojiWire, 0, len(guild.Emojis))
	for _, emoji := range guild.Emojis {
		res = append(res, wire.GuildEmojiWire{
			ID:        emoji.ID,
			Name:      emoji.Name,
			Managed:   emoji.Managed,
			Available: emoji.Available,
			Animated:  emoji.Animated,
		})
	}

	return c.JSON(wire.ListEmojisResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *GuildsHanlder) HandleListGuildStickers(c *fiber.Ctx) error {
	guildID := c.Params("guildID")
	if err := h.am.CheckUserInGuild(c, guildID); err != nil {
		return err
	}

	guild, err := h.bot.Rest.Guild(c.Context(), guildID)
	if err != nil {
		if errors.Is(err, rest.ErrNotFound) {
			return helpers.NotFound("unknown_guild", "The guild does not exist or the bot is missing access.")
		}
		return err
	}

	res := make([]wire.GuildStickerWire, 0, len(guild.Stickers))
	for _, sticker := range guild.Stickers {
		res = append(res, wire.GuildStickerWire{
			ID:          sticker.ID,
			Name:        sticker.Name,
			Available:   sticker.Available,
			Description: sticker.Description,
		})
	}

	return c.JSON(wire.ListStickersResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *GuildsHanlder) HandleGetGuildBranding(c *fiber.Ctx) error {
	guildID := c.Params("guildID")

	if err := h.am.CheckUserGuildAccess(c, guildID); err != nil {
		return err
	}

	res := wire.GuildBrandingWire{}

	customBot, err := h.pg.Q.GetCustomBotByGuildID(c.Context(), guildID)
	if err != nil {
		if err != sql.ErrNoRows {
			return err
		}
	} else {
		res.DefaultUsername = null.NewString(customBot.UserName, true)
		res.DefaultAvatarURL = null.NewString(
			util.DiscordAvatarURL(customBot.UserID, customBot.UserDiscriminator, customBot.UserAvatar.String),
			true,
		)
	}

	return c.JSON(wire.GetGuildBrandingResponseWire{
		Success: true,
		Data:    res,
	})
}

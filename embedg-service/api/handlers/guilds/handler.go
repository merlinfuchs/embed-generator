package guilds

import (
	"errors"
	"fmt"

	"github.com/disgoorg/disgo/cache"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/rs/zerolog/log"
	"gopkg.in/guregu/null.v4"
)

type GuildsHanlder struct {
	customBotStore store.CustomBotStore
	caches         cache.Caches
	am             *access.AccessManager
	planStore      store.PlanStore
}

func New(customBotStore store.CustomBotStore, caches cache.Caches, am *access.AccessManager, planStore store.PlanStore) *GuildsHanlder {
	return &GuildsHanlder{
		customBotStore: customBotStore,
		caches:         caches,
		am:             am,
		planStore:      planStore,
	}
}

func (h *GuildsHanlder) HandleListGuilds(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)

	res := make([]wire.GuildWire, 0, len(session.GuildIDs))
	for _, guildID := range session.GuildIDs {
		guild, ok := h.caches.Guild(guildID)
		if !ok {
			continue
		}

		access, err := h.am.GetGuildAccessForUser(session.UserID, guildID)
		if err != nil {
			log.Error().Err(err).Msg("Failed to check guild access")
			return err
		}

		res = append(res, wire.GuildWire{
			ID:                       guild.ID,
			Name:                     guild.Name,
			Icon:                     null.StringFromPtr(guild.Icon),
			HasChannelWithUserAccess: access.HasChannelWithUserAccess,
			HasChannelWithBotAccess:  access.HasChannelWithBotAccess,
		})
	}

	return c.JSON(wire.ListGuildsResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *GuildsHanlder) HandleGetGuild(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	guildID, err := handlers.ParamID(c, "guildID")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	guild, ok := h.caches.Guild(guildID)
	if !ok {
		return handlers.NotFound("unknown_guild", "The guild does not exist.")
	}

	access, err := h.am.GetGuildAccessForUser(session.UserID, guildID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to check guild access")
		return err
	}

	res := wire.GuildWire{
		ID:                       guild.ID,
		Name:                     guild.Name,
		Icon:                     null.StringFromPtr(guild.Icon),
		HasChannelWithUserAccess: access.HasChannelWithUserAccess,
		HasChannelWithBotAccess:  access.HasChannelWithBotAccess,
	}

	return c.JSON(wire.GetGuildResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *GuildsHanlder) HandleListGuildChannels(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	guildID, err := handlers.ParamID(c, "guildID")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	// TODO: validate that this contains both channels and threads
	channels := h.caches.ChannelsForGuild(guildID)

	res := make([]wire.GuildChannelWire, 0)

	for channel := range channels {
		access, err := h.am.GetChannelAccessForUser(session.UserID, channel.ID())
		if err != nil {
			log.Error().Err(err).Msg("Failed to check channel access")
			return err
		}

		res = append(res, wire.GuildChannelWire{
			ID:              channel.ID(),
			Name:            channel.Name(),
			Position:        channel.Position(),
			ParentID:        common.NullIDFromPtr(channel.ParentID()),
			Type:            int(channel.Type()),
			UserAccess:      access.UserAccess(),
			UserPermissions: fmt.Sprintf("%d", access.UserPermissions),
			BotAccess:       access.BotAccess(),
			BotPermissions:  fmt.Sprintf("%d", access.BotPermissions),
		})
	}

	/* for _, channel := range guild.Threads {
		access, err := h.am.GetChannelAccessForUser(session.UserID, channel.ID)
		if err != nil {
			log.Error().Err(err).Msg("Failed to check channel access")
			return err
		}

		res = append(res, wire.GuildChannelWire{
			ID:              channel.ID,
			Name:            channel.Name,
			Position:        channel.Position,
			ParentID:        null.NewString(channel.ParentID, channel.ParentID != ""),
			Type:            int(channel.Type),
			UserAccess:      access.UserAccess(),
			UserPermissions: fmt.Sprintf("%d", access.UserPermissions),
			BotAccess:       access.BotAccess(),
			BotPermissions:  fmt.Sprintf("%d", access.BotPermissions),
		})
	} */

	return c.JSON(wire.ListChannelsResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *GuildsHanlder) HandleListGuildRoles(c *fiber.Ctx) error {
	guildID, err := handlers.ParamID(c, "guildID")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	roles := h.caches.Roles(guildID)

	res := make([]wire.GuildRoleWire, 0)
	for role := range roles {
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
	guildID, err := handlers.ParamID(c, "guildID")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	emojis := h.caches.Emojis(guildID)

	res := make([]wire.GuildEmojiWire, 0)
	for emoji := range emojis {
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
	guildID, err := handlers.ParamID(c, "guildID")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	stickers := h.caches.Stickers(guildID)

	res := make([]wire.GuildStickerWire, 0)
	for sticker := range stickers {
		var available bool
		if sticker.Available != nil {
			available = *sticker.Available
		}

		res = append(res, wire.GuildStickerWire{
			ID:          sticker.ID,
			Name:        sticker.Name,
			Available:   available,
			Description: sticker.Description,
		})
	}

	return c.JSON(wire.ListStickersResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *GuildsHanlder) HandleGetGuildBranding(c *fiber.Ctx) error {
	guildID, err := handlers.ParamID(c, "guildID")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	res := wire.GuildBrandingWire{}

	customBot, err := h.customBotStore.GetCustomBotByGuildID(c.Context(), guildID)
	if err != nil {
		if !errors.Is(err, store.ErrNotFound) {
			return err
		}
	} else {
		res.DefaultUsername = null.NewString(customBot.UserName, true)
		res.DefaultAvatarURL = null.NewString(
			common.DiscordAvatarURL(customBot.UserID, customBot.UserDiscriminator, customBot.UserAvatar.String),
			true,
		)
	}

	return c.JSON(wire.GetGuildBrandingResponseWire{
		Success: true,
		Data:    res,
	})
}

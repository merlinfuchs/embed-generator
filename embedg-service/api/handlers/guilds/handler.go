package guilds

import (
	"errors"
	"fmt"

	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"gopkg.in/guregu/null.v4"
)

type GuildsHanlder struct {
	customBotStore store.CustomBotStore
	guildStore     store.GuildStore
	guildState     *guildstate.Provider
	am             *access.AccessManager
	planStore      store.PlanStore
}

func New(customBotStore store.CustomBotStore, guildStore store.GuildStore, guildState *guildstate.Provider, am *access.AccessManager, planStore store.PlanStore) *GuildsHanlder {
	return &GuildsHanlder{
		customBotStore: customBotStore,
		guildStore:     guildStore,
		guildState:     guildState,
		am:             am,
		planStore:      planStore,
	}
}

func (h *GuildsHanlder) HandleListGuilds(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)

	// The user's own guild list, not session.GuildIDs, which is captured at login and never refreshed.
	userGuilds, err := h.am.GetGuildsForUser(c.UserContext(), session)
	if err != nil {
		slog.Error("Failed to get guilds for user", slog.Any("error", err))
		return err
	}

	guildIDs := make([]common.ID, 0, len(userGuilds))
	for _, guild := range userGuilds {
		guildIDs = append(guildIDs, guild.ID)
	}

	// Intersect with the guilds the bot is in. Name and icon come from there so the list shows what
	// the bot sees; computing channel level access for every guild would be a REST fan out each.
	guilds, err := h.guildStore.GetGuilds(c.UserContext(), guildIDs)
	if err != nil {
		slog.Error("Failed to get guilds", slog.Any("error", err))
		return err
	}

	res := make([]wire.GuildWire, 0, len(guilds))
	for _, guild := range guilds {
		res = append(res, wire.GuildWire{
			ID:   guild.ID,
			Name: guild.Name,
			Icon: guild.Icon,
		})
	}

	return c.JSON(wire.ListGuildsResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *GuildsHanlder) HandleGetGuild(c *fiber.Ctx) error {
	guildID, err := handlers.ParamID(c, "guildID")
	if err != nil {
		return err
	}

	// This already resolves the user's and the bot's permissions in the guild and 403s without them.
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	// Name and icon come from the guilds table, the same source the list uses, rather than a second
	// pass over the guild's channels and roles.
	guilds, err := h.guildStore.GetGuilds(c.UserContext(), []common.ID{guildID})
	if err != nil {
		slog.Error("Failed to get guild", slog.Any("error", err))
		return err
	}

	if len(guilds) == 0 {
		return handlers.NotFound("unknown_guild", "The guild does not exist.")
	}

	return c.JSON(wire.GetGuildResponseWire{
		Success: true,
		Data: wire.GuildWire{
			ID:   guilds[0].ID,
			Name: guilds[0].Name,
			Icon: guilds[0].Icon,
		},
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

	channels, err := h.am.ChannelAccessForGuild(c.UserContext(), session, guildID)
	if err != nil {
		slog.Error("Failed to check channel access", slog.Any("error", err))
		return err
	}

	res := make([]wire.GuildChannelWire, 0, len(channels))
	for _, channel := range channels {
		res = append(res, wire.GuildChannelWire{
			ID:              channel.Channel.ID(),
			Name:            channel.Channel.Name(),
			Position:        channel.Channel.Position(),
			ParentID:        common.NullIDFromPtr(channel.Channel.ParentID()),
			Type:            int(channel.Channel.Type()),
			UserAccess:      channel.Access.UserAccess(),
			UserPermissions: fmt.Sprintf("%d", channel.Access.UserPermissions),
			BotAccess:       channel.Access.BotAccess(),
			BotPermissions:  fmt.Sprintf("%d", channel.Access.BotPermissions),
		})
	}

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

	state, err := h.guildState.Guild(c.UserContext(), guildID)
	if err != nil {
		slog.Error("Failed to get guild state", slog.Any("error", err))
		return err
	}
	roles := state.Roles

	res := make([]wire.GuildRoleWire, 0)
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
	guildID, err := handlers.ParamID(c, "guildID")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	state, err := h.guildState.Guild(c.UserContext(), guildID)
	if err != nil {
		slog.Error("Failed to get guild state", slog.Any("error", err))
		return err
	}
	emojis := state.Emojis

	res := make([]wire.GuildEmojiWire, 0)
	for _, emoji := range emojis {
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

	state, err := h.guildState.Guild(c.UserContext(), guildID)
	if err != nil {
		slog.Error("Failed to get guild state", slog.Any("error", err))
		return err
	}
	stickers := state.Stickers

	res := make([]wire.GuildStickerWire, 0)
	for _, sticker := range stickers {
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

	customBot, err := h.customBotStore.GetCustomBotByGuildID(c.UserContext(), guildID)
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

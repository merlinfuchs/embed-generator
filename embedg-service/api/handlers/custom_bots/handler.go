package custom_bots

import (
	"errors"
	"fmt"
	"time"

	"slices"

	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/custom_bot"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"gopkg.in/guregu/null.v4"
)

type CustomBotsHandler struct {
	customBotManager   *custom_bot.CustomBotManager
	customCommandStore store.CustomCommandStore
	rest               rest.Rest
	caches             cache.Caches
	am                 *access.AccessManager
	planStore          store.PlanStore
	actionParser       *parser.ActionParser
	actionHandler      *handler.ActionHandler
}

func New(
	customBotManager *custom_bot.CustomBotManager,
	customCommandStore store.CustomCommandStore,
	rest rest.Rest,
	caches cache.Caches,
	am *access.AccessManager,
	planStore store.PlanStore,
	actionParser *parser.ActionParser,
	actionHandler *handler.ActionHandler,
) *CustomBotsHandler {
	return &CustomBotsHandler{
		customBotManager:   customBotManager,
		customCommandStore: customCommandStore,
		rest:               rest,
		caches:             caches,
		am:                 am,
		planStore:          planStore,
		actionParser:       actionParser,
		actionHandler:      actionHandler,
	}
}

func (h *CustomBotsHandler) HandleConfigureCustomBot(c *fiber.Ctx, req wire.CustomBotConfigureRequestWire) error {
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.Context(), guildID)
	if err != nil {
		return err
	}

	if !features.CustomBot {
		return handlers.Forbidden("insufficient_plan", "This feature is not available on your plan!")
	}

	restClient := rest.New(rest.NewClient(req.Token))

	app, err := restClient.GetCurrentApplication()
	if err != nil {
		if common.IsDiscordRestStatusCode(err, 401) {
			return fmt.Errorf("Invalid bot token, please check it again.")
		}
		return err
	}

	user, err := restClient.GetCurrentUser("")
	if err != nil {
		return err
	}

	isMember := true
	member, err := restClient.GetMember(guildID, user.ID)
	if err != nil {
		if common.IsDiscordRestErrorCode(err, discordgo.ErrCodeMissingAccess, discordgo.ErrCodeUnknownGuild) {
			isMember = false
		} else {
			return fmt.Errorf("Failed to check if custom bot is member of guild: %w", err)
		}
	}

	roles := h.caches.Roles(guildID)

	hasPermissions := false
	if isMember {
		for role := range roles {
			if slices.Contains(member.RoleIDs, role.ID) || role.ID == guildID {
				if role.Permissions&discord.PermissionManageWebhooks != 0 {
					hasPermissions = true
					break
				}
			}
		}
	}

	customBot, err := h.customBotManager.UpsertCustomBot(c.Context(), model.CustomBot{
		ID:                common.UniqueID().String(),
		GuildID:           guildID,
		ApplicationID:     app.ID,
		UserID:            user.ID,
		UserName:          user.Username,
		UserDiscriminator: user.Discriminator,
		UserAvatar:        null.StringFromPtr(user.Avatar),
		Token:             req.Token,
		PublicKey:         app.VerifyKey,
		CreatedAt:         time.Now().UTC(),
	})
	if err != nil {
		return err
	}

	return c.JSON(wire.CustomBotConfigureResponseWire{
		Success: true,
		Data: wire.CustomBotInfoWire{
			ID:                customBot.ID,
			ApplicationID:     customBot.ApplicationID,
			UserID:            customBot.UserID,
			UserName:          customBot.UserName,
			UserDiscriminator: customBot.UserDiscriminator,
			UserAvatar:        customBot.UserAvatar,

			TokenValid:              true,
			IsMember:                isMember,
			HasPermissions:          hasPermissions,
			HandledFirstInteraction: customBot.HandledFirstInteraction,
			InviteURL:               botInvite(customBot.ApplicationID, guildID),
			InteractionEndpointURL:  interactionEndpointURL(customBot.ID),

			GatewayStatus:        customBot.GatewayStatus,
			GatewayActivityType:  customBot.GatewayActivityType,
			GatewayActivityName:  customBot.GatewayActivityName,
			GatewayActivityState: customBot.GatewayActivityState,
			GatewayActivityURL:   customBot.GatewayActivityUrl,
		},
	})
}

func (h *CustomBotsHandler) HandleUpdateCustomBotPresence(c *fiber.Ctx, req wire.CustomBotUpdatePresenceRequestWire) error {
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.Context(), guildID)
	if err != nil {
		return err
	}

	if !features.CustomBot {
		return handlers.Forbidden("insufficient_plan", "This feature is not available on your plan!")
	}

	_, err = h.customBotManager.UpdateCustomBotPresence(c.Context(), store.UpdateCustomBotPresenceParams{
		GuildID:              guildID,
		GatewayStatus:        req.GatewayStatus,
		GatewayActivityType:  null.IntFrom(int64(req.GatewayActivityType)),
		GatewayActivityName:  null.NewString(req.GatewayActivityName, req.GatewayActivityName != ""),
		GatewayActivityState: null.NewString(req.GatewayActivityState, req.GatewayActivityState != ""),
		GatewayActivityUrl:   null.NewString(req.GatewayActivityURL, req.GatewayActivityURL != ""),
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("not_configured", "There is no custom bot configured right now")
		}
		return err
	}

	return c.JSON(wire.CustomBotUpdatePresenceResponseWire{
		Success: true,
		Data:    wire.CustomBotPresenceWire(req),
	})
}

func (h *CustomBotsHandler) HandleDisableCustomBot(c *fiber.Ctx) error {
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	_, err = h.customBotManager.DeleteCustomBot(c.Context(), guildID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("not_configured", "There is no custom bot configured right now")
		}
		return err
	}

	return c.JSON(wire.CustomBotDisableResponseWire{
		Success: true,
		Data:    wire.CustomBotDisableResponseDataWire{},
	})
}

func (h *CustomBotsHandler) HandleGetCustomBot(c *fiber.Ctx) error {
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	restClient, customBot, err := h.customBotManager.GetRestForGuild(c.Context(), guildID)
	if err != nil {
		return err
	}

	if customBot == nil {
		return handlers.NotFound("not_configured", "There is no custom bot configured right now")
	}

	isMember := true
	tokenValid := true
	member, err := restClient.GetMember(guildID, customBot.UserID)
	if err != nil {
		if common.IsDiscordRestStatusCode(err, 401) {
			tokenValid = false
			isMember = false
		} else if common.IsDiscordRestStatusCode(err, 403) || common.IsDiscordRestStatusCode(err, 404) {
			isMember = false
		} else {
			return err
		}
	}

	if member != nil {
		customBot, err = h.customBotManager.UpdateCustomBotUser(c.Context(), store.UpdateCustomBotUserParams{
			GuildID:           guildID,
			UserName:          member.User.Username,
			UserDiscriminator: member.User.Discriminator,
			UserAvatar:        null.StringFromPtr(member.User.Avatar),
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to update custom bot user info")
		}
	}

	roles := h.caches.Roles(guildID)

	hasPermissions := false
	if member != nil {
		for role := range roles {
			if slices.Contains(member.RoleIDs, role.ID) || role.ID == guildID {
				if role.Permissions&discord.PermissionManageWebhooks != 0 {
					hasPermissions = true
					break
				}
			}
		}
	}

	return c.JSON(wire.CustomBotGetResponseWire{
		Success: true,
		Data: wire.CustomBotInfoWire{
			ID:                customBot.ID,
			ApplicationID:     customBot.ApplicationID,
			UserID:            customBot.UserID,
			UserName:          customBot.UserName,
			UserDiscriminator: customBot.UserDiscriminator,
			UserAvatar:        customBot.UserAvatar,

			TokenValid:              tokenValid,
			IsMember:                isMember,
			HasPermissions:          hasPermissions,
			HandledFirstInteraction: customBot.HandledFirstInteraction,
			InviteURL:               botInvite(customBot.ApplicationID, guildID),
			InteractionEndpointURL:  interactionEndpointURL(customBot.ID),

			GatewayStatus:        customBot.GatewayStatus,
			GatewayActivityType:  customBot.GatewayActivityType,
			GatewayActivityName:  customBot.GatewayActivityName,
			GatewayActivityState: customBot.GatewayActivityState,
			GatewayActivityURL:   customBot.GatewayActivityUrl,
		},
	})
}

func botInvite(clientID common.ID, guildID common.ID) string {
	return fmt.Sprintf("https://discord.com/oauth2/authorize?client_id=%s&scope=bot&permissions=805306368&guild_id=%s", clientID, guildID)
}

func interactionEndpointURL(id string) string {
	return fmt.Sprintf("%s/gateway/%s", viper.GetString("api.public_url"), id)
}

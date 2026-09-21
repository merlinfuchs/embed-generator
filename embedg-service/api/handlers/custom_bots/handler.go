package custom_bots

import (
	"errors"
	"fmt"
	"time"

	"slices"

	"log/slog"

	"github.com/disgoorg/disgo/discord"
	disrest "github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/custom_bot"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"gopkg.in/guregu/null.v4"
)

type CustomBotsHandlerConfig struct {
	APIPublicURL string
}

type CustomBotsHandler struct {
	config             CustomBotsHandlerConfig
	customBotManager   *custom_bot.CustomBotManager
	customCommandStore store.CustomCommandStore
	guildState         *guildstate.Provider
	am                 *access.AccessManager
	planStore          store.PlanStore
	actionParser       *parser.ActionParser
	actionHandler      *handler.ActionHandler
}

func New(
	config CustomBotsHandlerConfig,
	customBotManager *custom_bot.CustomBotManager,
	customCommandStore store.CustomCommandStore,
	guildState *guildstate.Provider,
	am *access.AccessManager,
	planStore store.PlanStore,
	actionParser *parser.ActionParser,
	actionHandler *handler.ActionHandler,
) *CustomBotsHandler {
	return &CustomBotsHandler{
		config:             config,
		customBotManager:   customBotManager,
		customCommandStore: customCommandStore,
		guildState:         guildState,
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

	features, err := h.planStore.GetPlanFeaturesForGuild(c.UserContext(), guildID)
	if err != nil {
		return err
	}

	if !features.CustomBot {
		return handlers.Forbidden("insufficient_plan", "This feature is not available on your plan!")
	}

	restClient := rest.NewRestClient(req.Token)

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
		if common.IsDiscordRestErrorCode(err, disrest.JSONErrorCodeMissingAccess, disrest.JSONErrorCodeUnknownGuild) {
			isMember = false
		} else {
			return fmt.Errorf("Failed to check if custom bot is member of guild: %w", err)
		}
	}

	// A guild the main bot can't see means no roles to check, not a failed request.
	var roles []discord.Role
	state, err := h.guildState.Guild(c.UserContext(), guildID)
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		return fmt.Errorf("Failed to get guild state: %w", err)
	} else if state != nil {
		roles = state.Roles
	}

	hasPermissions := false
	if isMember {
		for _, role := range roles {
			if slices.Contains(member.RoleIDs, role.ID) || role.ID == guildID {
				if role.Permissions&discord.PermissionManageWebhooks != 0 {
					hasPermissions = true
					break
				}
			}
		}
	}

	customBot, err := h.customBotManager.UpsertCustomBot(c.UserContext(), model.CustomBot{
		ID:                common.InternalID(),
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
		return fmt.Errorf("failed to upsert custom bot: %w", err)
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
			InviteURL:               h.botInvite(customBot.ApplicationID, guildID),
			InteractionEndpointURL:  h.interactionEndpointURL(customBot.ID),

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

	features, err := h.planStore.GetPlanFeaturesForGuild(c.UserContext(), guildID)
	if err != nil {
		return err
	}

	if !features.CustomBot {
		return handlers.Forbidden("insufficient_plan", "This feature is not available on your plan!")
	}

	_, err = h.customBotManager.UpdateCustomBotPresence(c.UserContext(), store.UpdateCustomBotPresenceParams{
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
		return fmt.Errorf("failed to update custom bot presence: %w", err)
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

	_, err = h.customBotManager.DeleteCustomBot(c.UserContext(), guildID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("not_configured", "There is no custom bot configured right now")
		}
		return fmt.Errorf("failed to delete custom bot: %w", err)
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

	restClient, customBot, err := h.customBotManager.GetRestForGuild(c.UserContext(), guildID)
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
		customBot, err = h.customBotManager.UpdateCustomBotUser(c.UserContext(), store.UpdateCustomBotUserParams{
			GuildID:           guildID,
			UserName:          member.User.Username,
			UserDiscriminator: member.User.Discriminator,
			UserAvatar:        null.StringFromPtr(member.User.Avatar),
		})
		if err != nil {
			slog.Error("Failed to update custom bot user info", slog.Any("error", err))
		}
	}

	// A guild the main bot can't see means no roles to check, not a failed request.
	var roles []discord.Role
	state, err := h.guildState.Guild(c.UserContext(), guildID)
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		return fmt.Errorf("Failed to get guild state: %w", err)
	} else if state != nil {
		roles = state.Roles
	}

	hasPermissions := false
	if member != nil {
		for _, role := range roles {
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
			InviteURL:               h.botInvite(customBot.ApplicationID, guildID),
			InteractionEndpointURL:  h.interactionEndpointURL(customBot.ID),

			GatewayStatus:        customBot.GatewayStatus,
			GatewayActivityType:  customBot.GatewayActivityType,
			GatewayActivityName:  customBot.GatewayActivityName,
			GatewayActivityState: customBot.GatewayActivityState,
			GatewayActivityURL:   customBot.GatewayActivityUrl,
		},
	})
}

func (h *CustomBotsHandler) botInvite(clientID common.ID, guildID common.ID) string {
	return fmt.Sprintf("https://discord.com/oauth2/authorize?client_id=%s&scope=bot&permissions=805306368&guild_id=%s", clientID, guildID)
}

func (h *CustomBotsHandler) interactionEndpointURL(id string) string {
	return fmt.Sprintf("%s/gateway/%s", h.config.APIPublicURL, id)
}

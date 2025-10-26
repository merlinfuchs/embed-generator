package custom_bots

import (
	"database/sql"
	"fmt"
	"time"

	"slices"

	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"gopkg.in/guregu/null.v4"
)

type CustomBotsHandler struct {
	pg           *postgres.PostgresStore
	caches       cache.Caches
	am           *access.AccessManager
	planStore    store.PlanStore
	actionParser *parser.ActionParser
}

func New(pg *postgres.PostgresStore, caches cache.Caches, am *access.AccessManager, planStore store.PlanStore, actionParser *parser.ActionParser) *CustomBotsHandler {
	return &CustomBotsHandler{
		pg:           pg,
		caches:       caches,
		am:           am,
		planStore:    planStore,
		actionParser: actionParser,
	}
}

func (h *CustomBotsHandler) HandleConfigureCustomBot(c *fiber.Ctx, req wire.CustomBotConfigureRequestWire) error {
	guildID := c.Query("guild_id")
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.Context(), guildID)
	if err != nil {
		return err
	}

	if !features.CustomBot {
		return helpers.Forbidden("insufficient_plan", "This feature is not available on your plan!")
	}

	client := rest.New(rest.NewClient(req.Token))
	if err != nil {
		return err
	}

	app, err := client.GetCurrentApplication()
	if err != nil {
		if util.IsDiscordRestStatusCode(err, 401) {
			return fmt.Errorf("Invalid bot token, please check it again.")
		}
		return err
	}

	user, err := client.GetCurrentUser("")
	if err != nil {
		return err
	}

	isMember := true
	member, err := client.GetMember(util.ToID(guildID), user.ID)
	if err != nil {
		if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeMissingAccess, discordgo.ErrCodeUnknownGuild) {
			isMember = false
		} else {
			return fmt.Errorf("Failed to check if custom bot is member of guild: %w", err)
		}
	}

	roles := h.caches.Roles(util.ToID(guildID))

	hasPermissions := false
	if isMember {
		for role := range roles {
			if slices.Contains(member.RoleIDs, role.ID) || role.ID == util.ToID(guildID) {
				if role.Permissions&discordgo.PermissionManageWebhooks != 0 {
					hasPermissions = true
					break
				}
			}
		}
	}

	var userAvatar sql.NullString
	if user.Avatar != nil {
		userAvatar = sql.NullString{String: *user.Avatar, Valid: *user.Avatar != ""}
	}

	customBot, err := h.pg.Q.UpsertCustomBot(c.Context(), pgmodel.UpsertCustomBotParams{
		ID:                util.UniqueID(),
		GuildID:           guildID,
		ApplicationID:     app.ID.String(),
		UserID:            user.ID.String(),
		UserName:          user.Username,
		UserDiscriminator: user.Discriminator,
		UserAvatar:        userAvatar,
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
			UserAvatar:        null.String{NullString: customBot.UserAvatar},

			TokenValid:              true,
			IsMember:                isMember,
			HasPermissions:          hasPermissions,
			HandledFirstInteraction: customBot.HandledFirstInteraction,
			InviteURL:               botInvite(customBot.ApplicationID, guildID),
			InteractionEndpointURL:  interactionEndpointURL(customBot.ID),

			GatewayStatus:        customBot.GatewayStatus,
			GatewayActivityType:  null.NewInt(int64(customBot.GatewayActivityType.Int16), customBot.GatewayActivityType.Valid),
			GatewayActivityName:  null.String{NullString: customBot.GatewayActivityName},
			GatewayActivityState: null.String{NullString: customBot.GatewayActivityState},
			GatewayActivityURL:   null.String{NullString: customBot.GatewayActivityUrl},
		},
	})
}

func (h *CustomBotsHandler) HandleUpdateCustomBotPresence(c *fiber.Ctx, req wire.CustomBotUpdatePresenceRequestWire) error {
	guildID := c.Query("guild_id")
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.Context(), guildID)
	if err != nil {
		return err
	}

	if !features.CustomBot {
		return helpers.Forbidden("insufficient_plan", "This feature is not available on your plan!")
	}

	_, err = h.pg.Q.UpdateCustomBotPresence(c.Context(), pgmodel.UpdateCustomBotPresenceParams{
		GuildID:       guildID,
		GatewayStatus: req.GatewayStatus,
		GatewayActivityType: sql.NullInt16{
			Int16: int16(req.GatewayActivityType),
			Valid: true,
		},
		GatewayActivityName:  sql.NullString{String: req.GatewayActivityName, Valid: req.GatewayActivityName != ""},
		GatewayActivityState: sql.NullString{String: req.GatewayActivityState, Valid: req.GatewayActivityState != ""},
		GatewayActivityUrl:   sql.NullString{String: req.GatewayActivityURL, Valid: req.GatewayActivityURL != ""},
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("not_configured", "There is no custom bot configured right now")
		}
		return err
	}

	return c.JSON(wire.CustomBotUpdatePresenceResponseWire{
		Success: true,
		Data:    wire.CustomBotPresenceWire(req),
	})
}

func (h *CustomBotsHandler) HandleDisableCustomBot(c *fiber.Ctx) error {
	guildID := c.Query("guild_id")
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	_, err := h.pg.Q.DeleteCustomBot(c.Context(), guildID)
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("not_configured", "There is no custom bot configured right now")
		}
		return err
	}

	return c.JSON(wire.CustomBotDisableResponseWire{
		Success: true,
		Data:    wire.CustomBotDisableResponseDataWire{},
	})
}

func (h *CustomBotsHandler) HandleGetCustomBot(c *fiber.Ctx) error {
	guildID := c.Query("guild_id")
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	customBot, err := h.pg.Q.GetCustomBotByGuildID(c.Context(), guildID)
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("not_configured", "There is no custom bot configured right now")
		}
		return err
	}

	client := rest.New(rest.NewClient(customBot.Token))
	if err != nil {
		return err
	}

	isMember := true
	tokenValid := true
	member, err := client.GetMember(util.ToID(guildID), util.ToID(customBot.UserID))
	if err != nil {
		if util.IsDiscordRestStatusCode(err, 401) {
			tokenValid = false
			isMember = false
		} else if util.IsDiscordRestStatusCode(err, 403) || util.IsDiscordRestStatusCode(err, 404) {
			isMember = false
		} else {
			return err
		}
	}

	var userAvatar sql.NullString
	if member.User.Avatar != nil {
		userAvatar = sql.NullString{String: *member.User.Avatar, Valid: *member.User.Avatar != ""}
	}

	if member != nil {
		customBot, err = h.pg.Q.UpdateCustomBotUser(c.Context(), pgmodel.UpdateCustomBotUserParams{
			GuildID:           guildID,
			UserName:          member.User.Username,
			UserDiscriminator: member.User.Discriminator,
			UserAvatar:        userAvatar,
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to update custom bot user info")
		}
	}

	roles := h.caches.Roles(util.ToID(guildID))

	hasPermissions := false
	if member != nil {
		for role := range roles {
			if slices.Contains(member.RoleIDs, role.ID) || role.ID == util.ToID(guildID) {
				if role.Permissions&discordgo.PermissionManageWebhooks != 0 {
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
			UserAvatar:        null.String{NullString: customBot.UserAvatar},

			TokenValid:              tokenValid,
			IsMember:                isMember,
			HasPermissions:          hasPermissions,
			HandledFirstInteraction: customBot.HandledFirstInteraction,
			InviteURL:               botInvite(customBot.ApplicationID, guildID),
			InteractionEndpointURL:  interactionEndpointURL(customBot.ID),

			GatewayStatus:        customBot.GatewayStatus,
			GatewayActivityType:  null.NewInt(int64(customBot.GatewayActivityType.Int16), customBot.GatewayActivityType.Valid),
			GatewayActivityName:  null.String{NullString: customBot.GatewayActivityName},
			GatewayActivityState: null.String{NullString: customBot.GatewayActivityState},
			GatewayActivityURL:   null.String{NullString: customBot.GatewayActivityUrl},
		},
	})
}

func botInvite(clientID, guildID string) string {
	return fmt.Sprintf("https://discord.com/oauth2/authorize?client_id=%s&scope=bot&permissions=805306368&guild_id=%s", clientID, guildID)
}

func interactionEndpointURL(id string) string {
	return fmt.Sprintf("%s/gateway/%s", viper.GetString("api.public_url"), id)
}

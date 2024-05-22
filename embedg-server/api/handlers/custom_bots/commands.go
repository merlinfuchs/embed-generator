package custom_bots

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/sqlc-dev/pqtype"
	"gopkg.in/guregu/null.v4"
)

func (h *CustomBotsHandler) HandleListCustomCommands(c *fiber.Ctx) error {
	guildID := c.Query("guild_id")
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	commands, err := h.pg.Q.GetCustomCommands(c.Context(), guildID)
	if err != nil {
		return err
	}

	res := make([]wire.CustomCommandWire, 0, len(commands))
	for _, cmd := range commands {
		var parameters []wire.CustomCommandParameterWire
		err := json.Unmarshal(cmd.Parameters, &parameters)
		if err != nil {
			return fmt.Errorf("Failed to unmarshal command parameters: %w", err)
		}

		res = append(res, wire.CustomCommandWire{
			ID:          cmd.ID,
			Name:        cmd.Name,
			Description: cmd.Description,
			Enabled:     cmd.Enabled,
			Parameters:  parameters,
			Actions:     cmd.Actions,
			CreatedAt:   cmd.CreatedAt,
			UpdatedAt:   cmd.UpdatedAt,
			DeployedAt:  null.Time{NullTime: cmd.DeployedAt},
		})
	}

	return c.JSON(wire.CustomCommandsListResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *CustomBotsHandler) HandleGetCustomCommand(c *fiber.Ctx) error {
	guildID := c.Query("guild_id")
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	command, err := h.pg.Q.GetCustomCommand(c.Context(), pgmodel.GetCustomCommandParams{
		GuildID: guildID,
		ID:      c.Params("commandID"),
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("command_not_found", "No command found with this ID")
		}
		return err
	}

	var parameters []wire.CustomCommandParameterWire
	err = json.Unmarshal(command.Parameters, &parameters)
	if err != nil {
		return fmt.Errorf("Failed to unmarshal command parameters: %w", err)
	}

	return c.JSON(wire.CustomCommandGetResponseWire{
		Success: true,
		Data: wire.CustomCommandWire{
			ID:          command.ID,
			Name:        command.Name,
			Description: command.Description,
			Enabled:     command.Enabled,
			Parameters:  parameters,
			Actions:     command.Actions,
			CreatedAt:   command.CreatedAt,
			UpdatedAt:   command.UpdatedAt,
			DeployedAt:  null.Time{NullTime: command.DeployedAt},
		},
	})
}

func (h *CustomBotsHandler) HandleCreateCustomCommand(c *fiber.Ctx, req wire.CustomCommandCreateRequestWire) error {
	session := c.Locals("session").(*session.Session)
	req.Normalize()

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

	existingCount, err := h.pg.Q.CountCustomCommands(c.Context(), guildID)
	if err != nil {
		return err
	}

	if int(existingCount) >= features.MaxCustomCommands {
		return helpers.Forbidden("insufficient_plan", "You have reached the maximum number of custom commands for your plan!")
	}

	actionSet := actions.ActionSet{}
	err = json.Unmarshal(req.Actions, &actionSet)
	if err != nil {
		return err
	}

	derivedPerms, err := h.actionParser.DerivePermissionsForActions(session.UserID, guildID, "")
	if err != nil {
		return helpers.BadRequest("invalid_actions", err.Error())
	}

	rawDerivedPerms, err := json.Marshal(derivedPerms)
	if err != nil {
		return err
	}

	rawParameters, err := json.Marshal(req.Parameters)
	if err != nil {
		return err
	}

	command, err := h.pg.Q.InsertCustomCommand(c.Context(), pgmodel.InsertCustomCommandParams{
		ID:          util.UniqueID(),
		GuildID:     guildID,
		Name:        req.Name,
		Description: req.Description,
		Parameters:  rawParameters,
		Actions:     req.Actions,
		DerivedPermissions: pqtype.NullRawMessage{
			Valid:      true,
			RawMessage: rawDerivedPerms,
		},
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	})
	if err != nil {
		return err
	}

	return c.JSON(wire.CustomCommandCreateResponseWire{
		Success: true,
		Data: wire.CustomCommandWire{
			ID:          command.ID,
			Name:        command.Name,
			Description: command.Description,
			Enabled:     command.Enabled,
			Parameters:  req.Parameters,
			Actions:     command.Actions,
			CreatedAt:   command.CreatedAt,
			UpdatedAt:   command.UpdatedAt,
			DeployedAt:  null.Time{NullTime: command.DeployedAt},
		},
	})
}

func (h *CustomBotsHandler) HandleUpdateCustomCommand(c *fiber.Ctx, req wire.CustomCommandUpdateRequestWire) error {
	session := c.Locals("session").(*session.Session)
	req.Normalize()

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

	actionSet := actions.ActionSet{}
	err = json.Unmarshal(req.Actions, &actionSet)
	if err != nil {
		return err
	}

	derivedPerms, err := h.actionParser.DerivePermissionsForActions(session.UserID, guildID, "")
	if err != nil {
		return helpers.BadRequest("invalid_actions", err.Error())
	}

	rawDerivedPerms, err := json.Marshal(derivedPerms)
	if err != nil {
		return err
	}

	rawParameters, err := json.Marshal(req.Parameters)
	if err != nil {
		return fmt.Errorf("Failed to marshal parameters: %w", err)
	}

	command, err := h.pg.Q.UpdateCustomCommand(c.Context(), pgmodel.UpdateCustomCommandParams{
		ID:          c.Params("commandID"),
		GuildID:     guildID,
		Name:        req.Name,
		Description: req.Description,
		Enabled:     req.Enabled,
		Parameters:  rawParameters,
		Actions:     req.Actions,
		DerivedPermissions: pqtype.NullRawMessage{
			Valid:      true,
			RawMessage: rawDerivedPerms,
		},
		UpdatedAt: time.Now().UTC(),
	})
	if err != nil {
		return err
	}

	return c.JSON(wire.CustomCommandCreateResponseWire{
		Success: true,
		Data: wire.CustomCommandWire{
			ID:          command.ID,
			Name:        command.Name,
			Description: command.Description,
			Enabled:     command.Enabled,
			Parameters:  req.Parameters,
			Actions:     command.Actions,
			CreatedAt:   command.CreatedAt,
			UpdatedAt:   command.UpdatedAt,
		},
	})
}

func (h *CustomBotsHandler) HandleDeleteCustomCommand(c *fiber.Ctx) error {
	guildID := c.Query("guild_id")
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	_, err := h.pg.Q.DeleteCustomCommand(c.Context(), pgmodel.DeleteCustomCommandParams{
		GuildID: guildID,
		ID:      c.Params("commandID"),
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("command_not_found", "No command found with this ID")
		}
		return err
	}

	return c.JSON(wire.CustomCommandDeleteResponseWire{
		Success: true,
	})
}

func (h *CustomBotsHandler) HandleDeployCustomCommands(c *fiber.Ctx) error {
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

	customBot, err := h.pg.Q.GetCustomBotByGuildID(c.Context(), guildID)
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("not_configured", "There is no custom bot configured right now, you need to configure one first.")
		}
		return fmt.Errorf("Failed to retrieve custom bot: %w", err)
	}

	commands, err := h.pg.Q.GetCustomCommands(c.Context(), guildID)
	if err != nil {
		return fmt.Errorf("Failed to retrieve custom commands: %w", err)
	}

	collision, payload := commandsToPayload(commands)
	if collision != nil {
		return &wire.Error{
			Code:    "name_collision",
			Message: "There are name collisions in your custom commands, please fix them first.",
			Data:    collision,
		}
	}

	session, err := discordgo.New("Bot " + customBot.Token)
	if err != nil {
		return fmt.Errorf("Failed to create custom bot session: %w", err)
	}

	_, err = session.ApplicationCommandBulkOverwrite(customBot.ApplicationID, guildID, payload)
	if err != nil {
		return fmt.Errorf("Failed to deploy commands: %w", err)
	}

	_, err = h.pg.Q.SetCustomCommandsDeployedAt(c.Context(), pgmodel.SetCustomCommandsDeployedAtParams{
		GuildID: guildID,
		DeployedAt: sql.NullTime{
			Time:  time.Now().UTC(),
			Valid: true,
		},
	})
	if err != nil {
		return fmt.Errorf("Failed to set deployed_at: %w", err)
	}

	return c.JSON(wire.CustomCommandsDeployResponseWire{
		Success: true,
	})
}

func commandsToPayload(commands []pgmodel.CustomCommand) (error, []*discordgo.ApplicationCommand) {
	res := make([]*discordgo.ApplicationCommand, 0, len(commands))

	for _, cmd := range commands {
		nameParts := strings.Split(cmd.Name, " ")

		parameters := make([]wire.CustomCommandParameterWire, 0, len(cmd.Parameters))
		err := json.Unmarshal(cmd.Parameters, &parameters)
		if err != nil {
			return fmt.Errorf("Failed to unmarshal command parameters: %w", err), nil
		}

		options := make([]*discordgo.ApplicationCommandOption, 0, len(cmd.Parameters))
		for _, param := range parameters {
			options = append(options, &discordgo.ApplicationCommandOption{
				Type:        discordgo.ApplicationCommandOptionType(param.Type),
				Name:        param.Name,
				Description: param.Description,
				Required:    true,
			})
		}

		var rootCMD *discordgo.ApplicationCommand
		for _, c := range res {
			if c.Name == nameParts[0] {
				if len(nameParts) == 1 {
					return &NameCollisionError{
						FirstName:  cmd.Name,
						SecondName: c.Name,
					}, nil
				} else {
					rootCMD = c
					break
				}
			}
		}

		if rootCMD == nil {
			rootCMD = &discordgo.ApplicationCommand{
				Type:        discordgo.ChatApplicationCommand,
				Name:        nameParts[0],
				Description: cmd.Description,
			}
			if len(nameParts) == 1 {
				rootCMD.Options = options
			}
			res = append(res, rootCMD)
		}

		var secondCMD *discordgo.ApplicationCommandOption
		if len(nameParts) >= 2 {
			for _, c := range rootCMD.Options {
				if c.Name == nameParts[1] {
					if len(nameParts) == 2 || c.Type != discordgo.ApplicationCommandOptionSubCommandGroup {
						return &NameCollisionError{
							FirstName:  cmd.Name,
							SecondName: c.Name,
						}, nil
					} else {
						secondCMD = c
						break
					}
				}
			}

			if secondCMD == nil {
				secondCMD = &discordgo.ApplicationCommandOption{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        nameParts[1],
					Description: cmd.Description,
				}
				if len(nameParts) == 2 {
					secondCMD.Options = options
				}
				rootCMD.Options = append(rootCMD.Options, secondCMD)
			}
		}

		if len(nameParts) >= 3 {
			for _, c := range secondCMD.Options {
				if c.Name == nameParts[2] {
					return &NameCollisionError{
						FirstName:  cmd.Name,
						SecondName: c.Name,
					}, nil
				}
			}

			secondCMD.Type = discordgo.ApplicationCommandOptionSubCommandGroup
			secondCMD.Options = append(secondCMD.Options, &discordgo.ApplicationCommandOption{
				Type:        discordgo.ApplicationCommandOptionSubCommand,
				Name:        nameParts[2],
				Description: cmd.Description,
				Options:     options,
			})
		}
	}

	return nil, res
}

type NameCollisionError struct {
	FirstName  string `json:"first_name"`
	SecondName string `json:"second_name"`
}

func (e *NameCollisionError) Error() string {
	return fmt.Sprintf("Name collision between %s and %s", e.FirstName, e.SecondName)
}

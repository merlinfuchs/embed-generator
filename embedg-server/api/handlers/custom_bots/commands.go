package custom_bots

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
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
		res = append(res, wire.CustomCommandWire{
			ID:          cmd.ID,
			Name:        cmd.Name,
			Description: cmd.Description,
			Enabled:     cmd.Enabled,
			Parameters:  cmd.Parameters,
			Actions:     cmd.Actions,
			CreatedAt:   cmd.CreatedAt,
		})
	}

	return c.JSON(wire.ListCustomCommandsResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *CustomBotsHandler) HandleGetCustomCommand(c *fiber.Ctx) error {
	guildID := c.Query("guild_id")
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	command, err := h.pg.Q.GetCustomCommand(c.Context(), postgres.GetCustomCommandParams{
		GuildID: guildID,
		ID:      c.Params("commandID"),
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("command_not_found", "No command found with this ID")
		}
		return err
	}

	return c.JSON(wire.CustomCommandGetResponseWire{
		Success: true,
		Data: wire.CustomCommandWire{
			ID:          command.ID,
			Name:        command.Name,
			Description: command.Description,
			Enabled:     command.Enabled,
			Parameters:  command.Parameters,
			Actions:     command.Actions,
			CreatedAt:   command.CreatedAt,
		},
	})
}

func (h *CustomBotsHandler) HandleCreateCustomCommand(c *fiber.Ctx, req wire.CustomCommandCreateRequestWire) error {
	guildID := c.Query("guild_id")
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	features, err := h.pm.GetPlanFeaturesForGuild(c.Context(), guildID)
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

	// TODO: check that command name doesn't coflict with other commands

	command, err := h.pg.Q.InsertCustomCommand(c.Context(), postgres.InsertCustomCommandParams{
		ID:          util.UniqueID(),
		GuildID:     guildID,
		Name:        req.Name,
		Description: req.Description,
		Parameters:  req.Parameters,
		Actions:     req.Actions,
		CreatedAt:   time.Now().UTC(),
		UpdatedAt:   time.Now().UTC(),
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
			Parameters:  command.Parameters,
			Actions:     command.Actions,
			CreatedAt:   command.CreatedAt,
		},
	})
}

func (h *CustomBotsHandler) HandleUpdateCustomCommand(c *fiber.Ctx, req wire.CustomCommandUpdateRequestWire) error {
	guildID := c.Query("guild_id")
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	features, err := h.pm.GetPlanFeaturesForGuild(c.Context(), guildID)
	if err != nil {
		return err
	}

	if !features.CustomBot {
		return helpers.Forbidden("insufficient_plan", "This feature is not available on your plan!")
	}

	// TODO: check that command name doesn't coflict with other commands

	command, err := h.pg.Q.UpdateCustomCommand(c.Context(), postgres.UpdateCustomCommandParams{
		ID:          c.Params("commandID"),
		GuildID:     guildID,
		Name:        req.Name,
		Description: req.Description,
		Enabled:     req.Enabled,
		Actions:     req.Actions,
		UpdatedAt:   time.Now().UTC(),
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
			Parameters:  command.Parameters,
			Actions:     command.Actions,
			CreatedAt:   command.CreatedAt,
		},
	})
}

func (h *CustomBotsHandler) HandleDeleteCustomCommand(c *fiber.Ctx) error {
	guildID := c.Query("guild_id")
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	_, err := h.pg.Q.DeleteCustomCommand(c.Context(), postgres.DeleteCustomCommandParams{
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

func (h *CustomBotsHandler) HandlDeployCustomCommands(c *fiber.Ctx) error {
	guildID := c.Query("guild_id")
	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	features, err := h.pm.GetPlanFeaturesForGuild(c.Context(), guildID)
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

	_, err = session.ApplicationCommandBulkOverwrite(customBot.Token, guildID, payload)
	if err != nil {
		return fmt.Errorf("Failed to deploy commands: %w", err)
	}

	return c.JSON(wire.CustomCommandsDeployResponseWire{
		Success: true,
	})
}

func commandsToPayload(commands []postgres.CustomCommand) (error, []*discordgo.ApplicationCommand) {
	res := make([]*discordgo.ApplicationCommand, 0, len(commands))

	for _, cmd := range commands {
		nameParts := strings.Split(cmd.Name, " ")

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
				}
			}
		}

		if rootCMD == nil {
			rootCMD = &discordgo.ApplicationCommand{
				// TODO
			}
		}
		res = append(res, rootCMD)

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
					}
				}
			}
		}

		if secondCMD == nil {
			secondCMD = &discordgo.ApplicationCommandOption{
				// TODO
			}
		}
		rootCMD.Options = append(rootCMD.Options, secondCMD)

		var thirdCMD *discordgo.ApplicationCommandOption
		if len(nameParts) >= 3 {
			for _, c := range secondCMD.Options {
				if c.Name == nameParts[2] {
					return &NameCollisionError{
						FirstName:  cmd.Name,
						SecondName: c.Name,
					}, nil
				}
			}
		}

		if thirdCMD == nil {
			thirdCMD = &discordgo.ApplicationCommandOption{
				// TODO
			}
		}
		secondCMD.Options = append(secondCMD.Options, thirdCMD)
	}

	return nil, res
}

type NameCollisionError struct {
	FirstName  string
	SecondName string
}

func (e *NameCollisionError) Error() string {
	return fmt.Sprintf("Name collision between %s and %s", e.FirstName, e.SecondName)
}

package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"gopkg.in/guregu/null.v4"
)

var _ store.CustomCommandStore = (*Client)(nil)

func (c *Client) GetCustomCommands(ctx context.Context, guildID common.ID) ([]model.CustomCommand, error) {
	rows, err := c.Q.GetCustomCommands(ctx, guildID.String())
	if err != nil {
		return nil, err
	}
	return rowsToCustomCommands(rows), nil
}

func (c *Client) GetCustomCommand(ctx context.Context, guildID common.ID, id string) (*model.CustomCommand, error) {
	row, err := c.Q.GetCustomCommand(ctx, pgmodel.GetCustomCommandParams{
		ID:      id,
		GuildID: guildID.String(),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToCustomCommand(row), nil
}

func (c *Client) GetCustomCommandByName(ctx context.Context, guildID common.ID, name string) (*model.CustomCommand, error) {
	row, err := c.Q.GetCustomCommandByName(ctx, pgmodel.GetCustomCommandByNameParams{
		Name:    name,
		GuildID: guildID.String(),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToCustomCommand(row), nil
}

func (c *Client) CountCustomCommands(ctx context.Context, guildID common.ID) (int64, error) {
	count, err := c.Q.CountCustomCommands(ctx, guildID.String())
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (c *Client) CreateCustomCommand(ctx context.Context, customCommand model.CustomCommand) (*model.CustomCommand, error) {
	row, err := c.Q.InsertCustomCommand(ctx, pgmodel.InsertCustomCommandParams{
		ID:                 customCommand.ID,
		GuildID:            customCommand.GuildID.String(),
		Name:               customCommand.Name,
		Description:        customCommand.Description,
		Parameters:         customCommand.Parameters,
		Actions:            customCommand.Actions,
		DerivedPermissions: customCommand.DerivedPermissions,
		CreatedAt:          pgtype.Timestamp{Time: customCommand.CreatedAt, Valid: true},
		UpdatedAt:          pgtype.Timestamp{Time: customCommand.UpdatedAt, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return rowToCustomCommand(row), nil
}

func (c *Client) UpdateCustomCommand(ctx context.Context, customCommand model.CustomCommand) (*model.CustomCommand, error) {
	row, err := c.Q.UpdateCustomCommand(ctx, pgmodel.UpdateCustomCommandParams{
		ID:                 customCommand.ID,
		GuildID:            customCommand.GuildID.String(),
		Name:               customCommand.Name,
		Description:        customCommand.Description,
		Enabled:            customCommand.Enabled,
		Actions:            customCommand.Actions,
		Parameters:         customCommand.Parameters,
		DerivedPermissions: customCommand.DerivedPermissions,
		UpdatedAt:          pgtype.Timestamp{Time: customCommand.UpdatedAt, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToCustomCommand(row), nil
}

func (c *Client) DeleteCustomCommand(ctx context.Context, guildID common.ID, id string) (*model.CustomCommand, error) {
	row, err := c.Q.DeleteCustomCommand(ctx, pgmodel.DeleteCustomCommandParams{
		ID:      id,
		GuildID: guildID.String(),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToCustomCommand(row), nil
}

func (c *Client) SetCustomCommandsDeployedAt(ctx context.Context, guildID common.ID, deployedAt time.Time) (*model.CustomCommand, error) {
	row, err := c.Q.SetCustomCommandsDeployedAt(ctx, pgmodel.SetCustomCommandsDeployedAtParams{
		GuildID:    guildID.String(),
		DeployedAt: pgtype.Timestamp{Time: deployedAt, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToCustomCommand(row), nil
}

func rowsToCustomCommands(rows []pgmodel.CustomCommand) []model.CustomCommand {
	commands := make([]model.CustomCommand, len(rows))
	for i, row := range rows {
		commands[i] = *rowToCustomCommand(row)
	}
	return commands
}

func rowToCustomCommand(row pgmodel.CustomCommand) *model.CustomCommand {
	var parameters json.RawMessage
	if row.Parameters != nil {
		parameters = json.RawMessage(row.Parameters)
	}

	var actions json.RawMessage
	if row.Actions != nil {
		actions = json.RawMessage(row.Actions)
	}

	var derivedPermissions json.RawMessage
	if row.DerivedPermissions != nil {
		derivedPermissions = json.RawMessage(row.DerivedPermissions)
	}

	return &model.CustomCommand{
		ID:                 row.ID,
		GuildID:            common.DefinitelyID(row.GuildID),
		Name:               row.Name,
		Description:        row.Description,
		Enabled:            row.Enabled,
		Parameters:         parameters,
		Actions:            actions,
		CreatedAt:          row.CreatedAt.Time,
		UpdatedAt:          row.UpdatedAt.Time,
		DeployedAt:         null.NewTime(row.DeployedAt.Time, row.DeployedAt.Valid),
		DerivedPermissions: derivedPermissions,
		LastUsedAt:         null.NewTime(row.LastUsedAt.Time, row.LastUsedAt.Valid),
	}
}

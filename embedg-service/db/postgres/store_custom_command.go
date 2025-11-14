package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions"
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
	return rowsToCustomCommands(rows)
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
	return rowToCustomCommand(row)
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
	return rowToCustomCommand(row)
}

func (c *Client) CountCustomCommands(ctx context.Context, guildID common.ID) (int64, error) {
	count, err := c.Q.CountCustomCommands(ctx, guildID.String())
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (c *Client) CreateCustomCommand(ctx context.Context, customCommand model.CustomCommand) (*model.CustomCommand, error) {
	rawActions, err := json.Marshal(customCommand.Actions)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal actions: %w", err)
	}

	rawDerivedPermissions, err := json.Marshal(customCommand.DerivedPermissions)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal derived permissions: %w", err)
	}

	row, err := c.Q.InsertCustomCommand(ctx, pgmodel.InsertCustomCommandParams{
		ID:                 customCommand.ID,
		GuildID:            customCommand.GuildID.String(),
		Name:               customCommand.Name,
		Description:        customCommand.Description,
		Parameters:         customCommand.Parameters,
		Actions:            rawActions,
		DerivedPermissions: rawDerivedPermissions,
		CreatedAt:          pgtype.Timestamp{Time: customCommand.CreatedAt, Valid: true},
		UpdatedAt:          pgtype.Timestamp{Time: customCommand.UpdatedAt, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return rowToCustomCommand(row)
}

func (c *Client) UpdateCustomCommand(ctx context.Context, customCommand model.CustomCommand) (*model.CustomCommand, error) {
	rawActions, err := json.Marshal(customCommand.Actions)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal actions: %w", err)
	}

	rawDerivedPermissions, err := json.Marshal(customCommand.DerivedPermissions)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal derived permissions: %w", err)
	}

	row, err := c.Q.UpdateCustomCommand(ctx, pgmodel.UpdateCustomCommandParams{
		ID:                 customCommand.ID,
		GuildID:            customCommand.GuildID.String(),
		Name:               customCommand.Name,
		Description:        customCommand.Description,
		Enabled:            customCommand.Enabled,
		Actions:            rawActions,
		Parameters:         customCommand.Parameters,
		DerivedPermissions: rawDerivedPermissions,
		UpdatedAt:          pgtype.Timestamp{Time: customCommand.UpdatedAt, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToCustomCommand(row)
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
	return rowToCustomCommand(row)
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
	return rowToCustomCommand(row)
}

func rowsToCustomCommands(rows []pgmodel.CustomCommand) ([]model.CustomCommand, error) {
	commands := make([]model.CustomCommand, len(rows))
	for i, row := range rows {
		command, err := rowToCustomCommand(row)
		if err != nil {
			return nil, err
		}
		commands[i] = *command
	}
	return commands, nil
}

func rowToCustomCommand(row pgmodel.CustomCommand) (*model.CustomCommand, error) {
	var parameters json.RawMessage
	if row.Parameters != nil {
		parameters = json.RawMessage(row.Parameters)
	}

	var acts actions.ActionSet
	err := json.Unmarshal(row.Actions, &acts)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal actions: %w", err)
	}

	var derivedPermissions *actions.ActionDerivedPermissions
	if row.DerivedPermissions != nil {
		derivedPermissions = &actions.ActionDerivedPermissions{}
		err := json.Unmarshal(row.DerivedPermissions, derivedPermissions)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal derived permissions: %w", err)
		}
	}

	return &model.CustomCommand{
		ID:                 row.ID,
		GuildID:            common.DefinitelyID(row.GuildID),
		Name:               row.Name,
		Description:        row.Description,
		Enabled:            row.Enabled,
		Parameters:         parameters,
		Actions:            acts,
		CreatedAt:          row.CreatedAt.Time,
		UpdatedAt:          row.UpdatedAt.Time,
		DeployedAt:         null.NewTime(row.DeployedAt.Time, row.DeployedAt.Valid),
		DerivedPermissions: derivedPermissions,
		LastUsedAt:         null.NewTime(row.LastUsedAt.Time, row.LastUsedAt.Valid),
	}, nil
}

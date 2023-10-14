// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.22.0
// source: custom_commands.sql

package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"github.com/sqlc-dev/pqtype"
)

const countCustomCommands = `-- name: CountCustomCommands :one
SELECT COUNT(*) FROM custom_commands WHERE guild_id = $1
`

func (q *Queries) CountCustomCommands(ctx context.Context, guildID string) (int64, error) {
	row := q.db.QueryRowContext(ctx, countCustomCommands, guildID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const deleteCustomCommand = `-- name: DeleteCustomCommand :one
DELETE FROM custom_commands WHERE id = $1 AND guild_id = $2 RETURNING id, guild_id, name, description, enabled, parameters, actions, created_at, updated_at, deployed_at, derived_permissions, last_used_at
`

type DeleteCustomCommandParams struct {
	ID      string
	GuildID string
}

func (q *Queries) DeleteCustomCommand(ctx context.Context, arg DeleteCustomCommandParams) (CustomCommand, error) {
	row := q.db.QueryRowContext(ctx, deleteCustomCommand, arg.ID, arg.GuildID)
	var i CustomCommand
	err := row.Scan(
		&i.ID,
		&i.GuildID,
		&i.Name,
		&i.Description,
		&i.Enabled,
		&i.Parameters,
		&i.Actions,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeployedAt,
		&i.DerivedPermissions,
		&i.LastUsedAt,
	)
	return i, err
}

const getCustomCommand = `-- name: GetCustomCommand :one
SELECT id, guild_id, name, description, enabled, parameters, actions, created_at, updated_at, deployed_at, derived_permissions, last_used_at FROM custom_commands WHERE id = $1 AND guild_id = $2
`

type GetCustomCommandParams struct {
	ID      string
	GuildID string
}

func (q *Queries) GetCustomCommand(ctx context.Context, arg GetCustomCommandParams) (CustomCommand, error) {
	row := q.db.QueryRowContext(ctx, getCustomCommand, arg.ID, arg.GuildID)
	var i CustomCommand
	err := row.Scan(
		&i.ID,
		&i.GuildID,
		&i.Name,
		&i.Description,
		&i.Enabled,
		&i.Parameters,
		&i.Actions,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeployedAt,
		&i.DerivedPermissions,
		&i.LastUsedAt,
	)
	return i, err
}

const getCustomCommandByName = `-- name: GetCustomCommandByName :one
SELECT id, guild_id, name, description, enabled, parameters, actions, created_at, updated_at, deployed_at, derived_permissions, last_used_at FROM custom_commands WHERE name = $1 AND guild_id = $2
`

type GetCustomCommandByNameParams struct {
	Name    string
	GuildID string
}

func (q *Queries) GetCustomCommandByName(ctx context.Context, arg GetCustomCommandByNameParams) (CustomCommand, error) {
	row := q.db.QueryRowContext(ctx, getCustomCommandByName, arg.Name, arg.GuildID)
	var i CustomCommand
	err := row.Scan(
		&i.ID,
		&i.GuildID,
		&i.Name,
		&i.Description,
		&i.Enabled,
		&i.Parameters,
		&i.Actions,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeployedAt,
		&i.DerivedPermissions,
		&i.LastUsedAt,
	)
	return i, err
}

const getCustomCommands = `-- name: GetCustomCommands :many
SELECT id, guild_id, name, description, enabled, parameters, actions, created_at, updated_at, deployed_at, derived_permissions, last_used_at FROM custom_commands WHERE guild_id = $1
`

func (q *Queries) GetCustomCommands(ctx context.Context, guildID string) ([]CustomCommand, error) {
	rows, err := q.db.QueryContext(ctx, getCustomCommands, guildID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []CustomCommand
	for rows.Next() {
		var i CustomCommand
		if err := rows.Scan(
			&i.ID,
			&i.GuildID,
			&i.Name,
			&i.Description,
			&i.Enabled,
			&i.Parameters,
			&i.Actions,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.DeployedAt,
			&i.DerivedPermissions,
			&i.LastUsedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const insertCustomCommand = `-- name: InsertCustomCommand :one
INSERT INTO custom_commands (id, guild_id, name, description, parameters, actions, derived_permissions, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, guild_id, name, description, enabled, parameters, actions, created_at, updated_at, deployed_at, derived_permissions, last_used_at
`

type InsertCustomCommandParams struct {
	ID                 string
	GuildID            string
	Name               string
	Description        string
	Parameters         json.RawMessage
	Actions            json.RawMessage
	DerivedPermissions pqtype.NullRawMessage
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

func (q *Queries) InsertCustomCommand(ctx context.Context, arg InsertCustomCommandParams) (CustomCommand, error) {
	row := q.db.QueryRowContext(ctx, insertCustomCommand,
		arg.ID,
		arg.GuildID,
		arg.Name,
		arg.Description,
		arg.Parameters,
		arg.Actions,
		arg.DerivedPermissions,
		arg.CreatedAt,
		arg.UpdatedAt,
	)
	var i CustomCommand
	err := row.Scan(
		&i.ID,
		&i.GuildID,
		&i.Name,
		&i.Description,
		&i.Enabled,
		&i.Parameters,
		&i.Actions,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeployedAt,
		&i.DerivedPermissions,
		&i.LastUsedAt,
	)
	return i, err
}

const setCustomCommandsDeployedAt = `-- name: SetCustomCommandsDeployedAt :one
UPDATE custom_commands SET deployed_at = $2 WHERE guild_id = $1 RETURNING id, guild_id, name, description, enabled, parameters, actions, created_at, updated_at, deployed_at, derived_permissions, last_used_at
`

type SetCustomCommandsDeployedAtParams struct {
	GuildID    string
	DeployedAt sql.NullTime
}

func (q *Queries) SetCustomCommandsDeployedAt(ctx context.Context, arg SetCustomCommandsDeployedAtParams) (CustomCommand, error) {
	row := q.db.QueryRowContext(ctx, setCustomCommandsDeployedAt, arg.GuildID, arg.DeployedAt)
	var i CustomCommand
	err := row.Scan(
		&i.ID,
		&i.GuildID,
		&i.Name,
		&i.Description,
		&i.Enabled,
		&i.Parameters,
		&i.Actions,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeployedAt,
		&i.DerivedPermissions,
		&i.LastUsedAt,
	)
	return i, err
}

const updateCustomCommand = `-- name: UpdateCustomCommand :one
UPDATE custom_commands SET name = $3, description = $4, enabled = $5, actions = $6, parameters = $7, derived_permissions = $8, updated_at = $9 WHERE id = $1 AND guild_id = $2 RETURNING id, guild_id, name, description, enabled, parameters, actions, created_at, updated_at, deployed_at, derived_permissions, last_used_at
`

type UpdateCustomCommandParams struct {
	ID                 string
	GuildID            string
	Name               string
	Description        string
	Enabled            bool
	Actions            json.RawMessage
	Parameters         json.RawMessage
	DerivedPermissions pqtype.NullRawMessage
	UpdatedAt          time.Time
}

func (q *Queries) UpdateCustomCommand(ctx context.Context, arg UpdateCustomCommandParams) (CustomCommand, error) {
	row := q.db.QueryRowContext(ctx, updateCustomCommand,
		arg.ID,
		arg.GuildID,
		arg.Name,
		arg.Description,
		arg.Enabled,
		arg.Actions,
		arg.Parameters,
		arg.DerivedPermissions,
		arg.UpdatedAt,
	)
	var i CustomCommand
	err := row.Scan(
		&i.ID,
		&i.GuildID,
		&i.Name,
		&i.Description,
		&i.Enabled,
		&i.Parameters,
		&i.Actions,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeployedAt,
		&i.DerivedPermissions,
		&i.LastUsedAt,
	)
	return i, err
}

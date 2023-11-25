// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.23.0
// source: saved_messages.sql

package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"
)

const deleteSavedMessageForCreator = `-- name: DeleteSavedMessageForCreator :exec
DELETE FROM saved_messages WHERE id = $1 AND creator_id = $2
`

type DeleteSavedMessageForCreatorParams struct {
	ID        string
	CreatorID string
}

func (q *Queries) DeleteSavedMessageForCreator(ctx context.Context, arg DeleteSavedMessageForCreatorParams) error {
	_, err := q.db.ExecContext(ctx, deleteSavedMessageForCreator, arg.ID, arg.CreatorID)
	return err
}

const deleteSavedMessageForGuild = `-- name: DeleteSavedMessageForGuild :exec
DELETE FROM saved_messages WHERE id = $1 AND guild_id = $2
`

type DeleteSavedMessageForGuildParams struct {
	ID      string
	GuildID sql.NullString
}

func (q *Queries) DeleteSavedMessageForGuild(ctx context.Context, arg DeleteSavedMessageForGuildParams) error {
	_, err := q.db.ExecContext(ctx, deleteSavedMessageForGuild, arg.ID, arg.GuildID)
	return err
}

const getSavedMessageForGuild = `-- name: GetSavedMessageForGuild :one
SELECT id, creator_id, guild_id, updated_at, name, description, data FROM saved_messages WHERE guild_id = $1 AND id = $2
`

type GetSavedMessageForGuildParams struct {
	GuildID sql.NullString
	ID      string
}

func (q *Queries) GetSavedMessageForGuild(ctx context.Context, arg GetSavedMessageForGuildParams) (SavedMessage, error) {
	row := q.db.QueryRowContext(ctx, getSavedMessageForGuild, arg.GuildID, arg.ID)
	var i SavedMessage
	err := row.Scan(
		&i.ID,
		&i.CreatorID,
		&i.GuildID,
		&i.UpdatedAt,
		&i.Name,
		&i.Description,
		&i.Data,
	)
	return i, err
}

const getSavedMessagesForCreator = `-- name: GetSavedMessagesForCreator :many
SELECT id, creator_id, guild_id, updated_at, name, description, data FROM saved_messages WHERE creator_id = $1 AND guild_id IS NULL ORDER BY updated_at DESC
`

func (q *Queries) GetSavedMessagesForCreator(ctx context.Context, creatorID string) ([]SavedMessage, error) {
	rows, err := q.db.QueryContext(ctx, getSavedMessagesForCreator, creatorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []SavedMessage
	for rows.Next() {
		var i SavedMessage
		if err := rows.Scan(
			&i.ID,
			&i.CreatorID,
			&i.GuildID,
			&i.UpdatedAt,
			&i.Name,
			&i.Description,
			&i.Data,
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

const getSavedMessagesForGuild = `-- name: GetSavedMessagesForGuild :many
SELECT id, creator_id, guild_id, updated_at, name, description, data FROM saved_messages WHERE guild_id = $1 ORDER BY updated_at DESC
`

func (q *Queries) GetSavedMessagesForGuild(ctx context.Context, guildID sql.NullString) ([]SavedMessage, error) {
	rows, err := q.db.QueryContext(ctx, getSavedMessagesForGuild, guildID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []SavedMessage
	for rows.Next() {
		var i SavedMessage
		if err := rows.Scan(
			&i.ID,
			&i.CreatorID,
			&i.GuildID,
			&i.UpdatedAt,
			&i.Name,
			&i.Description,
			&i.Data,
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

const insertSavedMessage = `-- name: InsertSavedMessage :one
INSERT INTO saved_messages (id, creator_id, guild_id, updated_at, name, description, data) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, creator_id, guild_id, updated_at, name, description, data
`

type InsertSavedMessageParams struct {
	ID          string
	CreatorID   string
	GuildID     sql.NullString
	UpdatedAt   time.Time
	Name        string
	Description sql.NullString
	Data        json.RawMessage
}

func (q *Queries) InsertSavedMessage(ctx context.Context, arg InsertSavedMessageParams) (SavedMessage, error) {
	row := q.db.QueryRowContext(ctx, insertSavedMessage,
		arg.ID,
		arg.CreatorID,
		arg.GuildID,
		arg.UpdatedAt,
		arg.Name,
		arg.Description,
		arg.Data,
	)
	var i SavedMessage
	err := row.Scan(
		&i.ID,
		&i.CreatorID,
		&i.GuildID,
		&i.UpdatedAt,
		&i.Name,
		&i.Description,
		&i.Data,
	)
	return i, err
}

const updateSavedMessageForCreator = `-- name: UpdateSavedMessageForCreator :one
UPDATE saved_messages SET updated_at = $3, name = $4, description = $5, data = $6 WHERE id = $1 AND creator_id = $2 RETURNING id, creator_id, guild_id, updated_at, name, description, data
`

type UpdateSavedMessageForCreatorParams struct {
	ID          string
	CreatorID   string
	UpdatedAt   time.Time
	Name        string
	Description sql.NullString
	Data        json.RawMessage
}

func (q *Queries) UpdateSavedMessageForCreator(ctx context.Context, arg UpdateSavedMessageForCreatorParams) (SavedMessage, error) {
	row := q.db.QueryRowContext(ctx, updateSavedMessageForCreator,
		arg.ID,
		arg.CreatorID,
		arg.UpdatedAt,
		arg.Name,
		arg.Description,
		arg.Data,
	)
	var i SavedMessage
	err := row.Scan(
		&i.ID,
		&i.CreatorID,
		&i.GuildID,
		&i.UpdatedAt,
		&i.Name,
		&i.Description,
		&i.Data,
	)
	return i, err
}

const updateSavedMessageForGuild = `-- name: UpdateSavedMessageForGuild :one
UPDATE saved_messages SET updated_at = $3, name = $4, description = $5, data = $6 WHERE id = $1 AND guild_id = $2 RETURNING id, creator_id, guild_id, updated_at, name, description, data
`

type UpdateSavedMessageForGuildParams struct {
	ID          string
	GuildID     sql.NullString
	UpdatedAt   time.Time
	Name        string
	Description sql.NullString
	Data        json.RawMessage
}

func (q *Queries) UpdateSavedMessageForGuild(ctx context.Context, arg UpdateSavedMessageForGuildParams) (SavedMessage, error) {
	row := q.db.QueryRowContext(ctx, updateSavedMessageForGuild,
		arg.ID,
		arg.GuildID,
		arg.UpdatedAt,
		arg.Name,
		arg.Description,
		arg.Data,
	)
	var i SavedMessage
	err := row.Scan(
		&i.ID,
		&i.CreatorID,
		&i.GuildID,
		&i.UpdatedAt,
		&i.Name,
		&i.Description,
		&i.Data,
	)
	return i, err
}

// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.18.0
// source: custom_bots.sql

package postgres

import (
	"context"
	"database/sql"
	"time"
)

const deleteCustomBot = `-- name: DeleteCustomBot :one
DELETE FROM custom_bots WHERE guild_id = $1 RETURNING id, guild_id, application_id, token, public_key, user_id, user_name, user_avatar, created_at
`

func (q *Queries) DeleteCustomBot(ctx context.Context, guildID string) (CustomBot, error) {
	row := q.db.QueryRowContext(ctx, deleteCustomBot, guildID)
	var i CustomBot
	err := row.Scan(
		&i.ID,
		&i.GuildID,
		&i.ApplicationID,
		&i.Token,
		&i.PublicKey,
		&i.UserID,
		&i.UserName,
		&i.UserAvatar,
		&i.CreatedAt,
	)
	return i, err
}

const getCustomBot = `-- name: GetCustomBot :one
SELECT id, guild_id, application_id, token, public_key, user_id, user_name, user_avatar, created_at FROM custom_bots WHERE id = $1
`

func (q *Queries) GetCustomBot(ctx context.Context, id string) (CustomBot, error) {
	row := q.db.QueryRowContext(ctx, getCustomBot, id)
	var i CustomBot
	err := row.Scan(
		&i.ID,
		&i.GuildID,
		&i.ApplicationID,
		&i.Token,
		&i.PublicKey,
		&i.UserID,
		&i.UserName,
		&i.UserAvatar,
		&i.CreatedAt,
	)
	return i, err
}

const getCustomBotByGuildID = `-- name: GetCustomBotByGuildID :one
SELECT id, guild_id, application_id, token, public_key, user_id, user_name, user_avatar, created_at FROM custom_bots WHERE guild_id = $1
`

func (q *Queries) GetCustomBotByGuildID(ctx context.Context, guildID string) (CustomBot, error) {
	row := q.db.QueryRowContext(ctx, getCustomBotByGuildID, guildID)
	var i CustomBot
	err := row.Scan(
		&i.ID,
		&i.GuildID,
		&i.ApplicationID,
		&i.Token,
		&i.PublicKey,
		&i.UserID,
		&i.UserName,
		&i.UserAvatar,
		&i.CreatedAt,
	)
	return i, err
}

const upsertCustomBot = `-- name: UpsertCustomBot :one
INSERT INTO custom_bots (id, guild_id, application_id, user_id, user_name, user_avatar, token, public_key, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
ON CONFLICT (guild_id) DO UPDATE SET id = $1, application_id = $3, user_id = $4, user_name = $5, user_avatar = $6, token = $7, public_key = $8, created_at = $9 
RETURNING id, guild_id, application_id, token, public_key, user_id, user_name, user_avatar, created_at
`

type UpsertCustomBotParams struct {
	ID            string
	GuildID       string
	ApplicationID string
	UserID        string
	UserName      string
	UserAvatar    sql.NullString
	Token         string
	PublicKey     string
	CreatedAt     time.Time
}

func (q *Queries) UpsertCustomBot(ctx context.Context, arg UpsertCustomBotParams) (CustomBot, error) {
	row := q.db.QueryRowContext(ctx, upsertCustomBot,
		arg.ID,
		arg.GuildID,
		arg.ApplicationID,
		arg.UserID,
		arg.UserName,
		arg.UserAvatar,
		arg.Token,
		arg.PublicKey,
		arg.CreatedAt,
	)
	var i CustomBot
	err := row.Scan(
		&i.ID,
		&i.GuildID,
		&i.ApplicationID,
		&i.Token,
		&i.PublicKey,
		&i.UserID,
		&i.UserName,
		&i.UserAvatar,
		&i.CreatedAt,
	)
	return i, err
}
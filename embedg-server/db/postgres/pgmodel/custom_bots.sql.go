// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.25.0
// source: custom_bots.sql

package pgmodel

import (
	"context"
	"database/sql"
	"time"
)

const deleteCustomBot = `-- name: DeleteCustomBot :one
DELETE FROM custom_bots WHERE guild_id = $1 RETURNING id, guild_id, application_id, token, public_key, user_id, user_name, user_discriminator, user_avatar, handled_first_interaction, created_at, token_invalid, gateway_status, gateway_activity_type, gateway_activity_name, gateway_activity_state, gateway_activity_url
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
		&i.UserDiscriminator,
		&i.UserAvatar,
		&i.HandledFirstInteraction,
		&i.CreatedAt,
		&i.TokenInvalid,
		&i.GatewayStatus,
		&i.GatewayActivityType,
		&i.GatewayActivityName,
		&i.GatewayActivityState,
		&i.GatewayActivityUrl,
	)
	return i, err
}

const getCustomBot = `-- name: GetCustomBot :one
SELECT id, guild_id, application_id, token, public_key, user_id, user_name, user_discriminator, user_avatar, handled_first_interaction, created_at, token_invalid, gateway_status, gateway_activity_type, gateway_activity_name, gateway_activity_state, gateway_activity_url FROM custom_bots WHERE id = $1
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
		&i.UserDiscriminator,
		&i.UserAvatar,
		&i.HandledFirstInteraction,
		&i.CreatedAt,
		&i.TokenInvalid,
		&i.GatewayStatus,
		&i.GatewayActivityType,
		&i.GatewayActivityName,
		&i.GatewayActivityState,
		&i.GatewayActivityUrl,
	)
	return i, err
}

const getCustomBotByGuildID = `-- name: GetCustomBotByGuildID :one
SELECT id, guild_id, application_id, token, public_key, user_id, user_name, user_discriminator, user_avatar, handled_first_interaction, created_at, token_invalid, gateway_status, gateway_activity_type, gateway_activity_name, gateway_activity_state, gateway_activity_url FROM custom_bots WHERE guild_id = $1
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
		&i.UserDiscriminator,
		&i.UserAvatar,
		&i.HandledFirstInteraction,
		&i.CreatedAt,
		&i.TokenInvalid,
		&i.GatewayStatus,
		&i.GatewayActivityType,
		&i.GatewayActivityName,
		&i.GatewayActivityState,
		&i.GatewayActivityUrl,
	)
	return i, err
}

const getCustomBots = `-- name: GetCustomBots :many
SELECT id, guild_id, application_id, token, public_key, user_id, user_name, user_discriminator, user_avatar, handled_first_interaction, created_at, token_invalid, gateway_status, gateway_activity_type, gateway_activity_name, gateway_activity_state, gateway_activity_url FROM custom_bots
`

func (q *Queries) GetCustomBots(ctx context.Context) ([]CustomBot, error) {
	rows, err := q.db.QueryContext(ctx, getCustomBots)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []CustomBot
	for rows.Next() {
		var i CustomBot
		if err := rows.Scan(
			&i.ID,
			&i.GuildID,
			&i.ApplicationID,
			&i.Token,
			&i.PublicKey,
			&i.UserID,
			&i.UserName,
			&i.UserDiscriminator,
			&i.UserAvatar,
			&i.HandledFirstInteraction,
			&i.CreatedAt,
			&i.TokenInvalid,
			&i.GatewayStatus,
			&i.GatewayActivityType,
			&i.GatewayActivityName,
			&i.GatewayActivityState,
			&i.GatewayActivityUrl,
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

const setCustomBotHandledFirstInteraction = `-- name: SetCustomBotHandledFirstInteraction :exec
UPDATE custom_bots SET handled_first_interaction = true WHERE id = $1
`

func (q *Queries) SetCustomBotHandledFirstInteraction(ctx context.Context, id string) error {
	_, err := q.db.ExecContext(ctx, setCustomBotHandledFirstInteraction, id)
	return err
}

const updateCustomBotPresence = `-- name: UpdateCustomBotPresence :one
UPDATE custom_bots SET gateway_status = $2, gateway_activity_type = $3, gateway_activity_name = $4, gateway_activity_state = $5, gateway_activity_url = $6 WHERE guild_id = $1 RETURNING id, guild_id, application_id, token, public_key, user_id, user_name, user_discriminator, user_avatar, handled_first_interaction, created_at, token_invalid, gateway_status, gateway_activity_type, gateway_activity_name, gateway_activity_state, gateway_activity_url
`

type UpdateCustomBotPresenceParams struct {
	GuildID              string
	GatewayStatus        string
	GatewayActivityType  sql.NullInt16
	GatewayActivityName  sql.NullString
	GatewayActivityState sql.NullString
	GatewayActivityUrl   sql.NullString
}

func (q *Queries) UpdateCustomBotPresence(ctx context.Context, arg UpdateCustomBotPresenceParams) (CustomBot, error) {
	row := q.db.QueryRowContext(ctx, updateCustomBotPresence,
		arg.GuildID,
		arg.GatewayStatus,
		arg.GatewayActivityType,
		arg.GatewayActivityName,
		arg.GatewayActivityState,
		arg.GatewayActivityUrl,
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
		&i.UserDiscriminator,
		&i.UserAvatar,
		&i.HandledFirstInteraction,
		&i.CreatedAt,
		&i.TokenInvalid,
		&i.GatewayStatus,
		&i.GatewayActivityType,
		&i.GatewayActivityName,
		&i.GatewayActivityState,
		&i.GatewayActivityUrl,
	)
	return i, err
}

const updateCustomBotTokenInvalid = `-- name: UpdateCustomBotTokenInvalid :one
UPDATE custom_bots SET token_invalid = $2 WHERE guild_id = $1 RETURNING id, guild_id, application_id, token, public_key, user_id, user_name, user_discriminator, user_avatar, handled_first_interaction, created_at, token_invalid, gateway_status, gateway_activity_type, gateway_activity_name, gateway_activity_state, gateway_activity_url
`

type UpdateCustomBotTokenInvalidParams struct {
	GuildID      string
	TokenInvalid bool
}

func (q *Queries) UpdateCustomBotTokenInvalid(ctx context.Context, arg UpdateCustomBotTokenInvalidParams) (CustomBot, error) {
	row := q.db.QueryRowContext(ctx, updateCustomBotTokenInvalid, arg.GuildID, arg.TokenInvalid)
	var i CustomBot
	err := row.Scan(
		&i.ID,
		&i.GuildID,
		&i.ApplicationID,
		&i.Token,
		&i.PublicKey,
		&i.UserID,
		&i.UserName,
		&i.UserDiscriminator,
		&i.UserAvatar,
		&i.HandledFirstInteraction,
		&i.CreatedAt,
		&i.TokenInvalid,
		&i.GatewayStatus,
		&i.GatewayActivityType,
		&i.GatewayActivityName,
		&i.GatewayActivityState,
		&i.GatewayActivityUrl,
	)
	return i, err
}

const updateCustomBotUser = `-- name: UpdateCustomBotUser :one
UPDATE custom_bots SET user_name = $2, user_discriminator = $3, user_avatar = $4 WHERE guild_id = $1 RETURNING id, guild_id, application_id, token, public_key, user_id, user_name, user_discriminator, user_avatar, handled_first_interaction, created_at, token_invalid, gateway_status, gateway_activity_type, gateway_activity_name, gateway_activity_state, gateway_activity_url
`

type UpdateCustomBotUserParams struct {
	GuildID           string
	UserName          string
	UserDiscriminator string
	UserAvatar        sql.NullString
}

func (q *Queries) UpdateCustomBotUser(ctx context.Context, arg UpdateCustomBotUserParams) (CustomBot, error) {
	row := q.db.QueryRowContext(ctx, updateCustomBotUser,
		arg.GuildID,
		arg.UserName,
		arg.UserDiscriminator,
		arg.UserAvatar,
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
		&i.UserDiscriminator,
		&i.UserAvatar,
		&i.HandledFirstInteraction,
		&i.CreatedAt,
		&i.TokenInvalid,
		&i.GatewayStatus,
		&i.GatewayActivityType,
		&i.GatewayActivityName,
		&i.GatewayActivityState,
		&i.GatewayActivityUrl,
	)
	return i, err
}

const upsertCustomBot = `-- name: UpsertCustomBot :one
INSERT INTO custom_bots (id, guild_id, application_id, user_id, user_name, user_discriminator, user_avatar, token, public_key, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
ON CONFLICT (guild_id) DO UPDATE SET id = $1, application_id = $3, user_id = $4, user_name = $5, user_discriminator = $6, user_avatar = $7, token = $8, public_key = $9, created_at = $10, handled_first_interaction = false, token_invalid = false
RETURNING id, guild_id, application_id, token, public_key, user_id, user_name, user_discriminator, user_avatar, handled_first_interaction, created_at, token_invalid, gateway_status, gateway_activity_type, gateway_activity_name, gateway_activity_state, gateway_activity_url
`

type UpsertCustomBotParams struct {
	ID                string
	GuildID           string
	ApplicationID     string
	UserID            string
	UserName          string
	UserDiscriminator string
	UserAvatar        sql.NullString
	Token             string
	PublicKey         string
	CreatedAt         time.Time
}

func (q *Queries) UpsertCustomBot(ctx context.Context, arg UpsertCustomBotParams) (CustomBot, error) {
	row := q.db.QueryRowContext(ctx, upsertCustomBot,
		arg.ID,
		arg.GuildID,
		arg.ApplicationID,
		arg.UserID,
		arg.UserName,
		arg.UserDiscriminator,
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
		&i.UserDiscriminator,
		&i.UserAvatar,
		&i.HandledFirstInteraction,
		&i.CreatedAt,
		&i.TokenInvalid,
		&i.GatewayStatus,
		&i.GatewayActivityType,
		&i.GatewayActivityName,
		&i.GatewayActivityState,
		&i.GatewayActivityUrl,
	)
	return i, err
}
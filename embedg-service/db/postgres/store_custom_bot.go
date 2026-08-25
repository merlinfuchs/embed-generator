package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"gopkg.in/guregu/null.v4"
)

var _ store.CustomBotStore = (*Client)(nil)

func (c *Client) UpsertCustomBot(ctx context.Context, customBot model.CustomBot) (*model.CustomBot, error) {
	row, err := c.Q.UpsertCustomBot(ctx, pgmodel.UpsertCustomBotParams{
		ID:                customBot.ID,
		GuildID:           customBot.GuildID.String(),
		ApplicationID:     customBot.ApplicationID.String(),
		UserID:            customBot.UserID.String(),
		UserName:          customBot.UserName,
		UserDiscriminator: customBot.UserDiscriminator,
		UserAvatar:        pgtype.Text{String: customBot.UserAvatar.String, Valid: customBot.UserAvatar.Valid},
		Token:             customBot.Token,
		PublicKey:         customBot.PublicKey,
		CreatedAt:         pgtype.Timestamp{Time: customBot.CreatedAt, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return rowToCustomBot(row), nil
}

func (c *Client) UpdateCustomBotPresence(ctx context.Context, params store.UpdateCustomBotPresenceParams) (*model.CustomBot, error) {
	row, err := c.Q.UpdateCustomBotPresence(ctx, pgmodel.UpdateCustomBotPresenceParams{
		GuildID:              params.GuildID.String(),
		GatewayStatus:        params.GatewayStatus,
		GatewayActivityType:  pgtype.Int2{Int16: int16(params.GatewayActivityType.Int64), Valid: params.GatewayActivityType.Valid},
		GatewayActivityName:  pgtype.Text{String: params.GatewayActivityName.String, Valid: params.GatewayActivityName.Valid},
		GatewayActivityState: pgtype.Text{String: params.GatewayActivityState.String, Valid: params.GatewayActivityState.Valid},
		GatewayActivityUrl:   pgtype.Text{String: params.GatewayActivityUrl.String, Valid: params.GatewayActivityUrl.Valid},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToCustomBot(row), nil
}

func (c *Client) UpdateCustomBotUser(ctx context.Context, params store.UpdateCustomBotUserParams) (*model.CustomBot, error) {
	row, err := c.Q.UpdateCustomBotUser(ctx, pgmodel.UpdateCustomBotUserParams{
		GuildID:           params.GuildID.String(),
		UserName:          params.UserName,
		UserDiscriminator: params.UserDiscriminator,
		UserAvatar:        pgtype.Text{String: params.UserAvatar.String, Valid: params.UserAvatar.Valid},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToCustomBot(row), nil
}

func (c *Client) UpdateCustomBotTokenInvalid(ctx context.Context, guildID common.ID) (*model.CustomBot, error) {
	row, err := c.Q.UpdateCustomBotTokenInvalid(ctx, pgmodel.UpdateCustomBotTokenInvalidParams{
		GuildID: guildID.String(),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToCustomBot(row), nil
}

func (c *Client) DeleteCustomBot(ctx context.Context, guildID common.ID) (*model.CustomBot, error) {
	row, err := c.Q.DeleteCustomBot(ctx, guildID.String())
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToCustomBot(row), nil
}

func (c *Client) GetCustomBot(ctx context.Context, id string) (*model.CustomBot, error) {
	row, err := c.Q.GetCustomBot(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToCustomBot(row), nil
}

func (c *Client) GetCustomBotByGuildID(ctx context.Context, guildID common.ID) (*model.CustomBot, error) {
	row, err := c.Q.GetCustomBotByGuildID(ctx, guildID.String())
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToCustomBot(row), nil
}

func (c *Client) SetCustomBotHandledFirstInteraction(ctx context.Context, id string) error {
	err := c.Q.SetCustomBotHandledFirstInteraction(ctx, id)
	if err != nil {
		return err
	}
	return nil
}

func (c *Client) GetCustomBots(ctx context.Context) ([]model.CustomBot, error) {
	rows, err := c.Q.GetCustomBots(ctx)
	if err != nil {
		return nil, err
	}
	return rowsToCustomBots(rows), nil
}

func rowsToCustomBots(rows []pgmodel.CustomBot) []model.CustomBot {
	bots := make([]model.CustomBot, len(rows))
	for i, row := range rows {
		bots[i] = *rowToCustomBot(row)
	}
	return bots
}

func rowToCustomBot(row pgmodel.CustomBot) *model.CustomBot {
	return &model.CustomBot{
		ID:                      row.ID,
		GuildID:                 common.DefinitelyID(row.GuildID),
		ApplicationID:           common.DefinitelyID(row.ApplicationID),
		Token:                   row.Token,
		PublicKey:               row.PublicKey,
		UserID:                  common.DefinitelyID(row.UserID),
		UserName:                row.UserName,
		UserDiscriminator:       row.UserDiscriminator,
		UserAvatar:              null.NewString(row.UserAvatar.String, row.UserAvatar.Valid),
		HandledFirstInteraction: row.HandledFirstInteraction,
		CreatedAt:               row.CreatedAt.Time,
		TokenInvalid:            row.TokenInvalid,
		GatewayStatus:           row.GatewayStatus,
		GatewayActivityType:     null.NewInt(int64(row.GatewayActivityType.Int16), row.GatewayActivityType.Valid),
		GatewayActivityName:     null.NewString(row.GatewayActivityName.String, row.GatewayActivityName.Valid),
		GatewayActivityState:    null.NewString(row.GatewayActivityState.String, row.GatewayActivityState.Valid),
		GatewayActivityUrl:      null.NewString(row.GatewayActivityUrl.String, row.GatewayActivityUrl.Valid),
	}
}

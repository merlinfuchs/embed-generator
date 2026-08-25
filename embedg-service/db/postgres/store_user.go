package postgres

import (
	"context"
	"errors"

	"github.com/disgoorg/snowflake/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"gopkg.in/guregu/null.v4"
)

var _ store.UserStore = (*Client)(nil)

func (c *Client) UpsertUser(ctx context.Context, user model.User) error {
	_, err := c.Q.UpsertUser(ctx, pgmodel.UpsertUserParams{
		ID:            user.ID.String(),
		Name:          user.Name,
		Discriminator: user.Discriminator,
		Avatar:        pgtype.Text{String: user.Avatar.String, Valid: user.Avatar.Valid},
	})
	return err
}

func (c *Client) GetUser(ctx context.Context, userID snowflake.ID) (*model.User, error) {
	row, err := c.Q.GetUser(ctx, userID.String())
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToUser(row), nil
}

func (c *Client) DeleteUser(ctx context.Context, userID snowflake.ID) error {
	err := c.Q.DeleteUser(ctx, userID.String())
	return err
}

func rowToUser(row pgmodel.User) *model.User {
	return &model.User{
		ID:            common.DefinitelyID(row.ID),
		Name:          row.Name,
		Discriminator: row.Discriminator,
		Avatar:        null.NewString(row.Avatar.String, row.Avatar.Valid),
		IsTester:      row.IsTester,
	}
}

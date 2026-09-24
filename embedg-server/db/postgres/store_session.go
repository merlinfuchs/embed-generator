package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

var _ store.SessionStore = (*Client)(nil)

func (c *Client) CreateSession(ctx context.Context, session model.Session) error {
	guildIds := make([]string, len(session.GuildIds))
	for i, id := range session.GuildIds {
		guildIds[i] = id.String()
	}

	_, err := c.Q.InsertSession(ctx, pgmodel.InsertSessionParams{
		TokenHash:      session.TokenHash,
		UserID:         session.UserID.String(),
		GuildIds:       guildIds,
		AccessToken:    session.AccessToken,
		RefreshToken:   session.RefreshToken,
		TokenExpiresAt: pgtype.Timestamp{Time: session.TokenExpiresAt, Valid: true},
		Scopes:         session.Scopes,
		CreatedAt:      pgtype.Timestamp{Time: session.CreatedAt, Valid: true},
		ExpiresAt:      pgtype.Timestamp{Time: session.ExpiresAt, Valid: true},
	})
	return err
}

func (c *Client) UpdateSessionTokens(ctx context.Context, params store.UpdateSessionTokensParams) error {
	return c.Q.UpdateSessionTokens(ctx, pgmodel.UpdateSessionTokensParams{
		TokenHash:      params.TokenHash,
		AccessToken:    params.AccessToken,
		RefreshToken:   params.RefreshToken,
		TokenExpiresAt: pgtype.Timestamp{Time: params.TokenExpiresAt, Valid: true},
	})
}

func (c *Client) GetSession(ctx context.Context, tokenHash string) (*model.Session, error) {
	row, err := c.Q.GetSession(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToSession(row), nil
}

func (c *Client) DeleteSession(ctx context.Context, tokenHash string) error {
	err := c.Q.DeleteSession(ctx, tokenHash)
	return err
}

func (c *Client) DeleteExpiredSessions(ctx context.Context) error {
	return c.Q.DeleteExpiredSessions(ctx)
}

func (c *Client) GetSessionsForUser(ctx context.Context, userID string) ([]model.Session, error) {
	rows, err := c.Q.GetSessionsForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return rowsToSessions(rows), nil
}

func rowsToSessions(rows []pgmodel.Session) []model.Session {
	sessions := make([]model.Session, len(rows))
	for i, row := range rows {
		sessions[i] = *rowToSession(row)
	}
	return sessions
}

func rowToSession(row pgmodel.Session) *model.Session {
	guildIds := make([]common.ID, len(row.GuildIds))
	for i, id := range row.GuildIds {
		guildIds[i] = common.DefinitelyID(id)
	}

	return &model.Session{
		TokenHash:      row.TokenHash,
		UserID:         common.DefinitelyID(row.UserID),
		GuildIds:       guildIds,
		AccessToken:    row.AccessToken,
		RefreshToken:   row.RefreshToken,
		TokenExpiresAt: row.TokenExpiresAt.Time,
		Scopes:         row.Scopes,
		CreatedAt:      row.CreatedAt.Time,
		ExpiresAt:      row.ExpiresAt.Time,
	}
}

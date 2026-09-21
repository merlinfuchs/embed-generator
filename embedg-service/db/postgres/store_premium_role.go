package postgres

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

var _ store.PremiumRoleStore = (*Client)(nil)

func (c *Client) GetPremiumRoleAssignments(ctx context.Context) ([]common.ID, error) {
	rows, err := c.Q.GetPremiumRoleAssignments(ctx)
	if err != nil {
		return nil, err
	}
	userIDs := make([]common.ID, len(rows))
	for i, row := range rows {
		userIDs[i] = common.ID(row)
	}
	return userIDs, nil
}

func (c *Client) UpsertPremiumRoleAssignment(ctx context.Context, userID common.ID, assignedAt time.Time) error {
	return c.Q.UpsertPremiumRoleAssignment(ctx, pgmodel.UpsertPremiumRoleAssignmentParams{
		UserID:     int64(userID),
		AssignedAt: pgtype.Timestamp{Time: assignedAt, Valid: true},
	})
}

func (c *Client) DeletePremiumRoleAssignment(ctx context.Context, userID common.ID) error {
	return c.Q.DeletePremiumRoleAssignment(ctx, int64(userID))
}

package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
)

// PremiumRoleStore tracks which users the premium role has been handed out to, so the role sweep
// can reconcile against stored state instead of asking Discord about every user.
type PremiumRoleStore interface {
	GetPremiumRoleAssignments(ctx context.Context) ([]common.ID, error)
	UpsertPremiumRoleAssignment(ctx context.Context, userID common.ID, assignedAt time.Time) error
	DeletePremiumRoleAssignment(ctx context.Context, userID common.ID) error
}

package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type EntitlementStore interface {
	GetActiveEntitlementsForGuild(ctx context.Context, guildID common.ID) ([]model.Entitlement, error)
	GetActiveEntitlementsForUser(ctx context.Context, userID common.ID) ([]model.Entitlement, error)
	GetEntitlements(ctx context.Context) ([]model.Entitlement, error)
	GetEntitlement(ctx context.Context, id common.ID, userID common.ID) (*model.Entitlement, error)
	UpdateEntitlementConsumedGuildID(ctx context.Context, id common.ID, consumedGuildID common.NullID) (*model.Entitlement, error)
	UpsertEntitlement(ctx context.Context, entitlement model.Entitlement) (*model.Entitlement, error)
	GetEntitledUserIDs(ctx context.Context) ([]common.ID, error)
}

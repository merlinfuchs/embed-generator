package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type PlanStore interface {
	GetPlanByID(id string) *model.Plan
	GetPlanBySKUID(skuID common.ID) *model.Plan
	GetPlanFeaturesForGuild(ctx context.Context, guildID common.ID) (model.PlanFeatures, error)
	GetPlanFeaturesForUser(ctx context.Context, userID common.ID) (model.PlanFeatures, error)
}

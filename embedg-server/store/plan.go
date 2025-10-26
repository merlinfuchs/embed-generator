package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

type PlanStore interface {
	GetPlanByID(id string) *model.Plan
	GetPlanBySKUID(skuID string) *model.Plan
	GetPlanFeaturesForGuild(ctx context.Context, guildID util.ID) (model.PlanFeatures, error)
	GetPlanFeaturesForUser(ctx context.Context, userID util.ID) (model.PlanFeatures, error)
}

package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

type PlanStore interface {
	GetPlanByID(id string) *model.Plan
	GetPlanBySKUID(skuID string) *model.Plan
	GetPlanFeaturesForGuild(ctx context.Context, guildID string) (model.PlanFeatures, error)
	GetPlanFeaturesForUser(ctx context.Context, userID string) (model.PlanFeatures, error)
}

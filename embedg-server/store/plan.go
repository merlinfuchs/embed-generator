package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

type PlanStore interface {
	GetPlanByID(id string) *model.Plan
	GetPlanBySKUID(skuID string) *model.Plan
	GetPlanFeaturesForGuild(ctx context.Context, guildID common.ID) (model.PlanFeatures, error)
	GetPlanFeaturesForUser(ctx context.Context, userID common.ID) (model.PlanFeatures, error)
	GetPlanForGuild(ctx context.Context, guildID common.ID) (string, model.PlanFeatures, error)
	GetPlanForUser(ctx context.Context, userID common.ID) (string, model.PlanFeatures, error)
	GetPaidPlans() []model.Plan
}

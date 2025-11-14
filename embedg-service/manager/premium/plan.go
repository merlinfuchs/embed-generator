package premium

import (
	"context"
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

func (m *PremiumManager) GetPlanByID(id string) *model.Plan {
	for _, plan := range m.config.Plans {
		if plan.ID == id {
			return &plan
		}
	}

	return nil
}

func (m *PremiumManager) GetPlanBySKUID(skuID common.ID) *model.Plan {
	for _, plan := range m.config.Plans {
		if plan.SKUID == skuID {
			return &plan
		}
	}

	return nil
}

func (m *PremiumManager) GetPlanFeaturesForGuild(ctx context.Context, guildID common.ID) (model.PlanFeatures, error) {
	planFeatures := m.defaultPlanFeatures

	entitlements, err := m.entitlementStore.GetActiveEntitlementsForGuild(ctx, guildID)
	if err != nil {
		return planFeatures, fmt.Errorf("failed to retrieve entitlments for guild: %w", err)
	}

	for _, entitlement := range entitlements {
		plan := m.GetPlanBySKUID(entitlement.SkuID)
		if plan != nil {
			planFeatures.Merge(plan.Features)
		}
	}

	return planFeatures, nil
}

func (m *PremiumManager) GetPlanFeaturesForUser(ctx context.Context, userID common.ID) (model.PlanFeatures, error) {
	planFeatures := m.defaultPlanFeatures

	entitlements, err := m.entitlementStore.GetActiveEntitlementsForUser(ctx, userID)
	if err != nil {
		return planFeatures, fmt.Errorf("failed to retrieve entitlments for user: %w", err)
	}

	for _, entitlement := range entitlements {
		plan := m.GetPlanBySKUID(entitlement.SkuID)
		if plan != nil {
			planFeatures.Merge(plan.Features)
		}
	}

	return planFeatures, nil
}

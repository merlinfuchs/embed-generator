package premium

import (
	"context"
	"fmt"
	"slices"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

func (m *PremiumManager) GetPlanByID(id string) *model.Plan {
	for _, plan := range m.config.Plans {
		if plan.ID == id {
			return &plan
		}
	}

	return nil
}

func (m *PremiumManager) GetPlanBySKUID(skuID string) *model.Plan {
	for _, plan := range m.config.Plans {
		if plan.SKUID == skuID {
			return &plan
		}
	}

	return nil
}

// GetPaidPlans returns the named plans that can be bought, once per name, in the order of the
// config, which goes from the cheapest to the most expensive plan.
func (m *PremiumManager) GetPaidPlans() []model.Plan {
	return m.paidPlans
}

func (m *PremiumManager) GetPlanFeaturesForGuild(ctx context.Context, guildID common.ID) (model.PlanFeatures, error) {
	_, features, err := m.GetPlanForGuild(ctx, guildID)
	return features, err
}

func (m *PremiumManager) GetPlanFeaturesForUser(ctx context.Context, userID common.ID) (model.PlanFeatures, error) {
	_, features, err := m.GetPlanForUser(ctx, userID)
	return features, err
}

// GetPlanForGuild returns the name of the most expensive plan the guild has, and the features of
// all its plans merged.
func (m *PremiumManager) GetPlanForGuild(ctx context.Context, guildID common.ID) (string, model.PlanFeatures, error) {
	entitlements, err := m.entitlementStore.GetActiveEntitlementsForGuild(ctx, guildID)
	if err != nil {
		return "", m.defaultPlanFeatures, fmt.Errorf("failed to retrieve entitlments for guild: %w", err)
	}

	name, features := m.planForEntitlements(entitlements)
	return name, features, nil
}

// GetPlanForUser is GetPlanForGuild for the plans of a user.
func (m *PremiumManager) GetPlanForUser(ctx context.Context, userID common.ID) (string, model.PlanFeatures, error) {
	entitlements, err := m.entitlementStore.GetActiveEntitlementsForUser(ctx, userID)
	if err != nil {
		return "", m.defaultPlanFeatures, fmt.Errorf("failed to retrieve entitlments for user: %w", err)
	}

	name, features := m.planForEntitlements(entitlements)
	return name, features, nil
}

func (m *PremiumManager) planForEntitlements(entitlements []model.Entitlement) (string, model.PlanFeatures) {
	name := ""
	rank := -1
	features := m.defaultPlanFeatures

	for _, plan := range m.config.Plans {
		if plan.SKUID == "" || !slices.ContainsFunc(entitlements, func(e model.Entitlement) bool {
			return e.SkuID == plan.SKUID
		}) {
			continue
		}

		features.Merge(plan.Features)

		// Ranked like GetPaidPlans, so a name listed again further down doesn't move it up.
		if r := slices.IndexFunc(m.paidPlans, func(p model.Plan) bool { return p.Name == plan.Name }); r > rank {
			name, rank = plan.Name, r
		}
	}

	return name, features
}

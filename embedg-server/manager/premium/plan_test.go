package premium

import (
	"testing"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

func newPlanTestManager() *PremiumManager {
	return NewPremiumManager(Config{Plans: []model.Plan{
		{ID: "default", Default: true, Features: model.PlanFeatures{MaxSavedMessages: 25}},
		{ID: "premium_server", Name: "Premium", SKUID: "premium", Features: model.PlanFeatures{MaxSavedMessages: 100, MaxScheduledMessages: 25}},
		{ID: "premium_lifetime", Name: "Premium", SKUID: "premium-lifetime", Consumable: true, Features: model.PlanFeatures{MaxSavedMessages: 100, MaxScheduledMessages: 25}},
		{ID: "legacy", SKUID: "legacy", Features: model.PlanFeatures{MaxScheduledMessages: 50}},
		{ID: "ultimate_server", Name: "Ultimate", SKUID: "ultimate", Features: model.PlanFeatures{MaxSavedMessages: 500, MaxScheduledMessages: 100}},
	}}, common.Shards{}, nil, nil, nil)
}

func TestGetPaidPlans(t *testing.T) {
	plans := newPlanTestManager().GetPaidPlans()

	if len(plans) != 2 || plans[0].ID != "premium_server" || plans[1].ID != "ultimate_server" {
		t.Errorf("plans = %+v, want premium_server and ultimate_server", plans)
	}
}

func TestPlanForEntitlements(t *testing.T) {
	m := newPlanTestManager()

	tests := []struct {
		name          string
		skus          []string
		wantPlan      string
		wantSaved     int
		wantScheduled int
	}{
		{"free", nil, "", 25, 0},
		{"premium", []string{"premium-lifetime"}, "Premium", 100, 25},
		{"unnamed plan keeps the name of a named one", []string{"premium", "legacy"}, "Premium", 100, 50},
		// Ultimate comes after Premium in the config, whatever order the entitlements are in.
		{"highest plan wins", []string{"ultimate", "premium"}, "Ultimate", 500, 100},
		{"unknown sku", []string{"other"}, "", 25, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entitlements := make([]model.Entitlement, len(tt.skus))
			for i, sku := range tt.skus {
				entitlements[i] = model.Entitlement{SkuID: sku}
			}

			plan, features := m.planForEntitlements(entitlements)
			if plan != tt.wantPlan || features.MaxSavedMessages != tt.wantSaved || features.MaxScheduledMessages != tt.wantScheduled {
				t.Errorf("got %q with %d saved and %d scheduled, want %q with %d and %d",
					plan, features.MaxSavedMessages, features.MaxScheduledMessages, tt.wantPlan, tt.wantSaved, tt.wantScheduled)
			}
		})
	}
}

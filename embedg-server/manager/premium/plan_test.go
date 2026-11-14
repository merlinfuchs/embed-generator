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
		// Listed after Ultimate, but still ranked as Premium.
		{ID: "premium_gift", Name: "Premium", SKUID: "premium-gift", Features: model.PlanFeatures{MaxSavedMessages: 100, MaxScheduledMessages: 25}},
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
		{"same name further down keeps its rank", []string{"ultimate", "premium-gift"}, "Ultimate", 500, 100},
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

func TestEmbedLinkAttribution(t *testing.T) {
	m := NewPremiumManager(Config{Plans: []model.Plan{
		{ID: "default", Default: true, Features: model.PlanFeatures{MaxSavedMessages: 25}},
		{ID: "premium_server", Name: "Premium", SKUID: "premium", Features: model.PlanFeatures{MaxSavedMessages: 100, IsPremium: true}},
		{ID: "embed_link_attribution", SKUID: "attribution", Features: model.PlanFeatures{RemoveEmbedLinkAttribution: true}},
	}}, common.Shards{}, nil, nil, nil)

	if plan := m.GetEmbedLinkAttributionPlan(); plan == nil || plan.ID != "embed_link_attribution" {
		t.Errorf("GetEmbedLinkAttributionPlan() = %+v, want embed_link_attribution", plan)
	}

	tests := []struct {
		name            string
		skus            []string
		wantAttribution bool
		wantPlan        string
		wantSaved       int
	}{
		{"free", nil, true, "", 25},
		{"premium", []string{"premium"}, false, "Premium", 100},
		// Only the line goes, the rest stays free.
		{"one-time purchase", []string{"attribution"}, false, "", 25},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entitlements := make([]model.Entitlement, len(tt.skus))
			for i, sku := range tt.skus {
				entitlements[i] = model.Entitlement{SkuID: sku}
			}

			plan, features := m.planForEntitlements(entitlements)
			if features.EmbedLinkAttribution() != tt.wantAttribution || plan != tt.wantPlan || features.MaxSavedMessages != tt.wantSaved {
				t.Errorf("got attribution %v, plan %q and %d saved, want %v, %q and %d",
					features.EmbedLinkAttribution(), plan, features.MaxSavedMessages, tt.wantAttribution, tt.wantPlan, tt.wantSaved)
			}
		})
	}
}

func TestGetEmbedLinkAttributionPlanNone(t *testing.T) {
	if plan := newPlanTestManager().GetEmbedLinkAttributionPlan(); plan != nil {
		t.Errorf("GetEmbedLinkAttributionPlan() = %+v, want nil", plan)
	}
}

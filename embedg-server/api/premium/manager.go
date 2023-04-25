package premium

import (
	"github.com/spf13/viper"
)

type PremiumManager struct {
	plans []*Plan
}

func (m *PremiumManager) GetPlanByID(id string) *Plan {
	for _, plan := range m.plans {
		if plan.ID == id {
			return plan
		}
	}

	return nil
}

func (m *PremiumManager) GetPlanByPriceID(priceID string) *Plan {
	for _, plan := range m.plans {
		if plan.PriceID == priceID {
			return plan
		}
	}

	return nil
}

func New() *PremiumManager {
	plans := make([]*Plan, 0)
	viper.UnmarshalKey("stripe.plans", &plans)

	return &PremiumManager{
		plans: plans,
	}
}

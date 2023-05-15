package premium

import (
	"github.com/rs/zerolog/log"
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
	err := viper.UnmarshalKey("stripe.plans", &plans)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to unmarshal plans")
	}

	return &PremiumManager{
		plans: plans,
	}
}

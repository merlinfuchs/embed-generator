package premium

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

type PremiumManager struct {
	pg                  *postgres.PostgresStore
	plans               []*Plan
	defaultPlanFeatures PlanFeatures
}

func (m *PremiumManager) GetPlanByID(id string) *Plan {
	for _, plan := range m.plans {
		if plan.ID == id {
			return plan
		}
	}

	return nil
}

func (m *PremiumManager) GetPlanBySKUID(skuID string) *Plan {
	for _, plan := range m.plans {
		if plan.SKUID == skuID {
			return plan
		}
	}

	return nil
}

func (m *PremiumManager) GetPlanFeaturesForGuild(ctx context.Context, guildID string) (PlanFeatures, error) {
	planFeatures := m.defaultPlanFeatures

	entitlements, err := m.pg.Q.GetActiveEntitlementForGuild(ctx, sql.NullString{String: guildID, Valid: true})
	if err != nil {
		return planFeatures, fmt.Errorf("Failed to retrieve entitlments for guild: %w", err)
	}

	for _, entitlement := range entitlements {
		plan := m.GetPlanBySKUID(entitlement.SkuID)
		if plan != nil {
			planFeatures.Merge(plan.Features)
		}
	}

	return planFeatures, nil
}

func (m *PremiumManager) GetPlanFeaturesForUser(ctx context.Context, userID string) (PlanFeatures, error) {
	planFeatures := m.defaultPlanFeatures

	entitlements, err := m.pg.Q.GetActiveEntitlementForUser(ctx, sql.NullString{String: userID, Valid: true})
	if err != nil {
		return planFeatures, fmt.Errorf("Failed to retrieve entitlments for user: %w", err)
	}

	for _, entitlement := range entitlements {
		plan := m.GetPlanBySKUID(entitlement.SkuID)
		if plan != nil {
			planFeatures.Merge(plan.Features)
		}
	}

	return planFeatures, nil
}

func New(pg *postgres.PostgresStore) *PremiumManager {
	plans := make([]*Plan, 0)
	err := viper.UnmarshalKey("premium.plans", &plans)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to unmarshal plans")
	}

	defaultPlanFeatures := PlanFeatures{}
	for _, plan := range plans {
		if plan.Default {
			defaultPlanFeatures = plan.Features
		}
	}

	return &PremiumManager{
		pg:                  pg,
		plans:               plans,
		defaultPlanFeatures: defaultPlanFeatures,
	}
}

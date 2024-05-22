package premium

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

type PremiumManager struct {
	pg                  *postgres.PostgresStore
	bot                 *bot.Bot
	plans               []*model.Plan
	defaultPlanFeatures model.PlanFeatures
}

func (m *PremiumManager) GetPlanByID(id string) *model.Plan {
	for _, plan := range m.plans {
		if plan.ID == id {
			return plan
		}
	}

	return nil
}

func (m *PremiumManager) GetPlanBySKUID(skuID string) *model.Plan {
	for _, plan := range m.plans {
		if plan.SKUID == skuID {
			return plan
		}
	}

	return nil
}

func (m *PremiumManager) GetPlanFeaturesForGuild(ctx context.Context, guildID string) (model.PlanFeatures, error) {
	planFeatures := m.defaultPlanFeatures

	entitlements, err := m.pg.Q.GetActiveEntitlementsForGuild(ctx, sql.NullString{String: guildID, Valid: true})
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

func (m *PremiumManager) GetPlanFeaturesForUser(ctx context.Context, userID string) (model.PlanFeatures, error) {
	planFeatures := m.defaultPlanFeatures

	entitlements, err := m.pg.Q.GetActiveEntitlementsForUser(ctx, sql.NullString{String: userID, Valid: true})
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

func (m *PremiumManager) GetEntitledUserIDs(ctx context.Context) ([]string, error) {
	entitlements, err := m.pg.Q.GetEntitlements(ctx)
	if err != nil {
		return nil, fmt.Errorf("Failed to retrieve entitlments: %w", err)
	}

	userIDs := make(map[string]struct{}, len(entitlements))
	for _, entitlement := range entitlements {
		if entitlement.UserID.Valid {
			userIDs[entitlement.UserID.String] = struct{}{}
		}
	}

	res := make([]string, 0, len(userIDs))
	for userID := range userIDs {
		res = append(res, userID)
	}

	return res, nil
}

func New(pg *postgres.PostgresStore, bot *bot.Bot) *PremiumManager {
	plans := make([]*model.Plan, 0)
	err := viper.UnmarshalKey("premium.plans", &plans)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to unmarshal plans")
	}

	defaultPlanFeatures := model.PlanFeatures{
		MaxSavedMessages:       25,
		MaxActionsPerComponent: 2,
	}
	for _, plan := range plans {
		if plan.Default {
			defaultPlanFeatures = plan.Features
		}
	}

	manager := &PremiumManager{
		pg:                  pg,
		bot:                 bot,
		plans:               plans,
		defaultPlanFeatures: defaultPlanFeatures,
	}

	go manager.lazyPremiumRolesTask()

	return manager
}

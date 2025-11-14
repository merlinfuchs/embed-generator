package premium

import (
	"context"
	"log/slog"
	"time"

	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

type Config struct {
	BeneficialGuildID common.ID
	BeneficialRoleID  common.ID
	Plans             []model.Plan
}

type PremiumManager struct {
	config              Config
	rest                rest.Rest
	entitlementStore    store.EntitlementStore
	defaultPlanFeatures model.PlanFeatures
}

func NewPremiumManager(
	config Config,
	rest rest.Rest,
	entitlementStore store.EntitlementStore,
) *PremiumManager {
	var defaultPlanFeatures model.PlanFeatures
	for _, plan := range config.Plans {
		if plan.Default {
			defaultPlanFeatures = plan.Features
		}
	}

	return &PremiumManager{
		config:              config,
		rest:                rest,
		entitlementStore:    entitlementStore,
		defaultPlanFeatures: defaultPlanFeatures,
	}
}

func (m *PremiumManager) Run(ctx context.Context) {
	entitlementTicker := time.NewTicker(time.Minute * 5)
	defer entitlementTicker.Stop()

	rolesTicker := time.NewTicker(time.Minute * 15)
	defer rolesTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-entitlementTicker.C:
			err := m.SyncEntitlements(ctx)
			if err != nil {
				slog.Error("Failed to sync entitlements", slog.Any("error", err))
				continue
			}
		case <-rolesTicker.C:
			err := m.assignPremiumRoles(ctx)
			if err != nil {
				slog.Error("Failed to sync premium roles", slog.Any("error", err))
				continue
			}
		}
	}
}

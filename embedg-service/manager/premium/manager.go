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
	shards              common.Shards
	rest                rest.Rest
	entitlementStore    store.EntitlementStore
	premiumRoleStore    store.PremiumRoleStore
	appContext          store.AppContext
	defaultPlanFeatures model.PlanFeatures
}

func NewPremiumManager(
	config Config,
	shards common.Shards,
	rest rest.Rest,
	entitlementStore store.EntitlementStore,
	premiumRoleStore store.PremiumRoleStore,
	appContext store.AppContext,
) *PremiumManager {
	var defaultPlanFeatures model.PlanFeatures
	for _, plan := range config.Plans {
		if plan.Default {
			defaultPlanFeatures = plan.Features
		}
	}

	return &PremiumManager{
		config:              config,
		shards:              shards,
		rest:                rest,
		entitlementStore:    entitlementStore,
		premiumRoleStore:    premiumRoleStore,
		appContext:          appContext,
		defaultPlanFeatures: defaultPlanFeatures,
	}
}

// Run keeps entitlements and premium roles in sync. Both sweep everything rather than a shard
// range, so only the leader runs them.
func (m *PremiumManager) Run(ctx context.Context) {
	if !m.shards.IsLeader() {
		return
	}

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

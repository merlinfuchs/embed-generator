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
	appContext          store.AppContext
	defaultPlanFeatures model.PlanFeatures

	memberRequestInterval time.Duration
}

func NewPremiumManager(
	config Config,
	shards common.Shards,
	rest rest.Rest,
	entitlementStore store.EntitlementStore,
	appContext store.AppContext,
) *PremiumManager {
	var defaultPlanFeatures model.PlanFeatures
	for _, plan := range config.Plans {
		if plan.Default {
			defaultPlanFeatures = plan.Features
		}
	}

	return &PremiumManager{
		memberRequestInterval: defaultMemberRequestInterval,

		config:              config,
		shards:              shards,
		rest:                rest,
		entitlementStore:    entitlementStore,
		appContext:          appContext,
		defaultPlanFeatures: defaultPlanFeatures,
	}
}

// Run keeps entitlements and premium roles in sync. Both sweep everything rather than a shard
// range, so only the leader runs them. They get a goroutine each because the role sweep paces
// itself against the member rate limit and can outrun the entitlement sync's interval.
func (m *PremiumManager) Run(ctx context.Context) {
	if !m.shards.IsLeader() {
		return
	}

	go runEvery(ctx, time.Minute*5, "Failed to sync entitlements", m.SyncEntitlements)
	go runEvery(ctx, time.Minute*15, "Failed to sync premium roles", m.assignPremiumRoles)
}

func runEvery(ctx context.Context, interval time.Duration, errMessage string, sweep func(context.Context) error) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := sweep(ctx); err != nil {
				slog.Error(errMessage, slog.Any("error", err))
			}
		}
	}
}

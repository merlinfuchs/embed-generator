package config

import (
	"testing"

	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

func TestValidateShards(t *testing.T) {
	tests := []struct {
		name    string
		config  DiscordConfig
		wantErr bool
	}{
		{"no ids is a single instance", DiscordConfig{ShardCount: 4}, false},
		{"ids within the count", DiscordConfig{ShardCount: 4, ShardIDs: []int{0, 3}}, false},
		{"id at the count is out of range", DiscordConfig{ShardCount: 4, ShardIDs: []int{4}}, true},
		{"negative id", DiscordConfig{ShardCount: 4, ShardIDs: []int{-1}}, true},
		{"duplicate id", DiscordConfig{ShardCount: 4, ShardIDs: []int{1, 1}}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := tt.config.validateShards(); (err != nil) != tt.wantErr {
				t.Errorf("validateShards() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateShardInstances(t *testing.T) {
	tests := []struct {
		name    string
		config  DiscordConfig
		wantErr bool
	}{
		{"index within count", DiscordConfig{ShardCount: 4, InstanceCount: 2, InstanceIndex: 1}, false},
		{"index at the count", DiscordConfig{ShardCount: 4, InstanceCount: 2, InstanceIndex: 2}, true},
		{"more instances than shards", DiscordConfig{ShardCount: 2, InstanceCount: 4}, true},
		{"both forms at once", DiscordConfig{ShardCount: 4, InstanceCount: 2, ShardIDs: []int{0}}, true},
		{"negative index", DiscordConfig{ShardCount: 4, InstanceCount: 2, InstanceIndex: -1}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := tt.config.validateShards(); (err != nil) != tt.wantErr {
				t.Errorf("validateShards() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateShardsUnpinnedCount(t *testing.T) {
	// shard_count 0 means "ask Discord", so the instance checks can't compare against it yet.
	cfg := DiscordConfig{ShardCount: 0, InstanceCount: 4, InstanceIndex: 1}
	if err := cfg.validateShards(); err != nil {
		t.Errorf("validateShards() error = %v, want nil", err)
	}
}

func TestValidatePlans(t *testing.T) {
	premium := model.PlanFeatures{MaxSavedMessages: 100}
	ultimate := model.PlanFeatures{MaxSavedMessages: 500}

	tests := []struct {
		name    string
		plans   []model.Plan
		wantErr bool
	}{
		{"same name, same features", []model.Plan{{ID: "a", Name: "Premium", Features: premium}, {ID: "b", Name: "Premium", Features: premium}}, false},
		{"different names", []model.Plan{{ID: "a", Name: "Premium", Features: premium}, {ID: "b", Name: "Ultimate", Features: ultimate}}, false},
		{"unnamed plans may differ", []model.Plan{{ID: "a", Features: premium}, {ID: "b", Features: ultimate}}, false},
		{"same name, different features", []model.Plan{{ID: "a", Name: "Premium", Features: premium}, {ID: "b", Name: "Premium", Features: ultimate}}, true},
		{"unnamed consumable", []model.Plan{{ID: "a", Consumable: true, Features: premium}}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := (PremiumConfig{Plans: tt.plans}).validatePlans(); (err != nil) != tt.wantErr {
				t.Errorf("validatePlans() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

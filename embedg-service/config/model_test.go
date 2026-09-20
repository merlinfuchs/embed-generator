package config

import "testing"

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

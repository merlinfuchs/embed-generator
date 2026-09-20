package common

import (
	"slices"
	"testing"
)

func TestShardsOwns(t *testing.T) {
	// Shard 1 of 4: (guildID >> 22) % 4 == 1.
	const onShardOne = ID(1 << 22)
	const onShardTwo = ID(2 << 22)

	tests := []struct {
		name   string
		shards Shards
		guild  ID
		want   bool
	}{
		{"every shard when none are configured", NewShards(4, nil), onShardOne, true},
		{"owned shard", NewShards(4, []int{0, 1}), onShardOne, true},
		{"shard owned by another instance", NewShards(4, []int{0, 1}), onShardTwo, false},
		{"guild id below the shard bits lands on shard 0", NewShards(4, []int{0}), ID(12345), true},
		{"no shards configured owns nothing", Shards{}, onShardOne, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.shards.Owns(tt.guild); got != tt.want {
				t.Errorf("Owns(%d) = %v, want %v", tt.guild, got, tt.want)
			}
		})
	}
}

func TestShardsLeader(t *testing.T) {
	if got := NewShards(3, nil); !slices.Equal(got.IDs, []int{0, 1, 2}) {
		t.Errorf("NewShards(3, nil).IDs = %v, want [0 1 2]", got.IDs)
	}
	if !NewShards(3, nil).IsLeader() {
		t.Error("a single instance should be the leader")
	}
	if NewShards(4, []int{2, 3}).IsLeader() {
		t.Error("an instance without shard 0 should not be the leader")
	}
}

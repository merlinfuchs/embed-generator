package common

import "testing"

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
		{"every shard when no ids are set", Shards{Count: 4}, onShardOne, true},
		{"owned shard", Shards{Count: 4, IDs: []int{0, 1}}, onShardOne, true},
		{"shard owned by another instance", Shards{Count: 4, IDs: []int{0, 1}}, onShardTwo, false},
		{"guild id below the shard bits lands on shard 0", Shards{Count: 4, IDs: []int{0}}, ID(12345), true},
		{"unconfigured count doesn't divide by zero", Shards{}, onShardOne, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.shards.Owns(tt.guild); got != tt.want {
				t.Errorf("Owns(%d) = %v, want %v", tt.guild, got, tt.want)
			}
		})
	}
}

func TestShardsAllAndLeader(t *testing.T) {
	every := Shards{Count: 3}
	if got := every.All(); len(got) != 3 || got[0] != 0 || got[2] != 2 {
		t.Errorf("All() = %v, want [0 1 2]", got)
	}
	if !every.IsLeader() {
		t.Error("a single instance should be the leader")
	}

	follower := Shards{Count: 4, IDs: []int{2, 3}}
	if got := follower.All(); len(got) != 2 {
		t.Errorf("All() = %v, want the configured ids", got)
	}
	if follower.IsLeader() {
		t.Error("an instance without shard 0 should not be the leader")
	}
}

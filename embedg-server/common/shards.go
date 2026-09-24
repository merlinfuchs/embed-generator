package common

import (
	"slices"

	"github.com/disgoorg/disgo/sharding"
)

// Shards is the set of gateway shards an instance is responsible for. Instances never talk to
// each other, they just agree on the same shard count and take disjoint slices of it.
type Shards struct {
	Count int
	IDs   []int
}

// ShardsForInstance gives instance index of instances every instances-th shard. The instances
// together cover every shard exactly once without any of them being told the ids, and it stays
// exact when the shard count doesn't divide evenly. Instance 0 always holds shard 0, so it is
// the leader.
func ShardsForInstance(shardCount int, index int, instances int) Shards {
	if instances <= 0 {
		return NewShards(shardCount, nil)
	}

	ids := make([]int, 0, shardCount/instances+1)
	for id := index; id < shardCount; id += instances {
		ids = append(ids, id)
	}

	return Shards{Count: shardCount, IDs: ids}
}

// NewShards fills in every shard of the count when no ids are configured, which is the single
// instance deployment, so nothing downstream has to special case it.
func NewShards(count int, ids []int) Shards {
	if len(ids) == 0 && count > 0 {
		ids = make([]int, count)
		for i := range ids {
			ids[i] = i
		}
	}

	return Shards{Count: count, IDs: ids}
}

// Owns reports whether this instance holds the shard a guild lands on. Work that must happen
// exactly once per guild across the deployment is gated on it.
func (s Shards) Owns(id ID) bool {
	if s.Count <= 0 || len(s.IDs) == 0 {
		// No shards configured at all, as in the admin CLI. Owning nothing is the safe answer:
		// owning everything would have every instance duplicate the work.
		return false
	}

	return slices.Contains(s.IDs, sharding.ShardIDByGuild(id, s.Count))
}

// IsLeader reports whether this instance runs the work that happens once per deployment rather
// than once per guild. Discord only delivers those events to shard 0 anyway.
func (s Shards) IsLeader() bool {
	return slices.Contains(s.IDs, 0)
}

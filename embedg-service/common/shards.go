package common

import "slices"

// Shards is the set of gateway shards an instance is responsible for. Instances never talk to
// each other, they just agree on the same shard count and take disjoint slices of it.
type Shards struct {
	Count int
	// IDs is empty for a single instance that owns every shard.
	IDs []int
}

// All returns the shard ids to connect, expanding the empty "every shard" case.
func (s Shards) All() []int {
	if len(s.IDs) != 0 {
		return s.IDs
	}

	ids := make([]int, s.Count)
	for i := range ids {
		ids[i] = i
	}
	return ids
}

// Owns reports whether this instance holds the shard a guild lands on. Work that must happen
// exactly once per guild across the deployment is gated on it.
func (s Shards) Owns(guildID ID) bool {
	if len(s.IDs) == 0 || s.Count <= 0 {
		return true
	}
	return slices.Contains(s.IDs, int(uint64(guildID)>>22)%s.Count)
}

// IsLeader reports whether this instance runs the work that must happen once per deployment
// rather than once per guild. Discord only delivers those events to shard 0 anyway.
func (s Shards) IsLeader() bool {
	return len(s.IDs) == 0 || slices.Contains(s.IDs, 0)
}

package wire

type ShardListWire struct {
	ShardCount int         `json:"shard_count"`
	Shards     []ShardWire `json:"shards"`
}

type ShardWire struct {
	ID         int    `json:"id"`
	Status     string `json:"status"`
	Latency    int64  `json:"latency"`
	Suspicious bool   `json:"suspicious"`
}

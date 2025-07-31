package wire

import "time"

type ShardListWire struct {
	ShardCount int         `json:"shard_count"`
	Shards     []ShardWire `json:"shards"`
}

type ShardWire struct {
	ID                     int       `json:"id"`
	LastHeartbeatAck       time.Time `json:"last_heartbeat_ack"`
	LastHeartbeatSent      time.Time `json:"last_heartbeat_sent"`
	ShouldReconnectOnError bool      `json:"should_reconnect_on_error"`
	ShouldRetryOnRateLimit bool      `json:"should_retry_on_rate_limit"`
	Suspicious             bool      `json:"suspicious"`
}

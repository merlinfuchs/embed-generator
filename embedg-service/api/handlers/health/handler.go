package health

import (
	"net/http"

	"github.com/disgoorg/disgo/gateway"
	"github.com/disgoorg/disgo/sharding"
	"github.com/gofiber/fiber/v2"
)

type HealthHandler struct {
	shardManager sharding.ShardManager
}

func New(shardManager sharding.ShardManager) *HealthHandler {
	return &HealthHandler{
		shardManager: shardManager,
	}
}

type shardWire struct {
	ID        int    `json:"id"`
	Status    string `json:"status"`
	LatencyMS int64  `json:"latency_ms"`
}

// HandleHealth reports whether the process is up. Shards reconnect on their own and can be down
// for minutes at a time without the service being unhealthy, so they are not part of it.
func (h *HealthHandler) HandleHealth(c *fiber.Ctx) error {
	return c.SendStatus(http.StatusOK)
}

// HandleShardHealth reports the gateway connections, and fails while any shard this instance owns
// is not ready. Don't restart on it: shards take minutes to identify after a deploy.
func (h *HealthHandler) HandleShardHealth(c *fiber.Ctx) error {
	shards := make([]shardWire, 0)
	ready := true

	for shard := range h.shardManager.Shards() {
		status := shard.Status()
		if status != gateway.StatusReady {
			ready = false
		}

		shards = append(shards, shardWire{
			ID:        shard.ShardID(),
			Status:    status.String(),
			LatencyMS: shard.Latency().Milliseconds(),
		})
	}

	if !ready {
		c.Status(http.StatusServiceUnavailable)
	}

	return c.JSON(shards)
}

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

// HandleHealth fails while any shard this instance owns is not ready, so a rolling deploy waits
// for the shards to identify before taking the next instance down.
func (h *HealthHandler) HandleHealth(c *fiber.Ctx) error {
	for shard := range h.shardManager.Shards() {
		if shard.Status() != gateway.StatusReady {
			return c.SendStatus(http.StatusServiceUnavailable)
		}
	}

	return c.SendStatus(http.StatusOK)
}

func (h *HealthHandler) HandleShardList(c *fiber.Ctx) error {
	shards := make([]shardWire, 0)
	for shard := range h.shardManager.Shards() {
		shards = append(shards, shardWire{
			ID:        shard.ShardID(),
			Status:    shard.Status().String(),
			LatencyMS: shard.Latency().Milliseconds(),
		})
	}

	return c.JSON(shards)
}

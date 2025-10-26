package health

import (
	"net/http"
	"time"

	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/gateway"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

type HealthHandler struct {
	client *bot.Client
}

func New(client *bot.Client) *HealthHandler {
	return &HealthHandler{
		client: client,
	}
}

func (h *HealthHandler) HandleHealth(c *fiber.Ctx) error {
	return c.SendStatus(http.StatusOK)
}

func (h *HealthHandler) HandleHealthShardList(c *fiber.Ctx) error {
	rawGuildID := c.Query("guild_id")
	var guildID util.ID
	if rawGuildID != "" {
		var err error
		guildID, err = util.ParseID(rawGuildID)
		if err != nil {
			return c.SendStatus(http.StatusBadRequest)
		}
	}

	shardListWire := make([]wire.ShardWire, 0)
	var shardCount int

	if guildID != 0 {
		shard := h.client.ShardManager.ShardByGuildID(guildID)

		shardListWire = append(shardListWire, wire.ShardWire{
			ID:         shard.ShardID(),
			Status:     shard.Status().String(),
			Latency:    shard.Latency().Milliseconds(),
			Suspicious: isShardSuspicious(shard),
		})
	} else {
		suspiciousOnly := c.Query("suspicious") == "true"

		shards := h.client.ShardManager.Shards()

		for shard := range shards {
			shardCount += 1

			suspicious := isShardSuspicious(shard)
			if suspiciousOnly && !suspicious {
				continue
			}

			shardListWire = append(shardListWire, wire.ShardWire{
				ID:         shard.ShardID(),
				Status:     shard.Status().String(),
				Latency:    shard.Latency().Milliseconds(),
				Suspicious: suspicious,
			})
		}
	}

	return c.JSON(wire.ShardListWire{
		ShardCount: shardCount,
		Shards:     shardListWire,
	})
}

func isShardSuspicious(shard gateway.Gateway) bool {
	if shard.Status() != gateway.StatusReady {
		return true
	}

	if shard.Latency() > 10*time.Second {
		return true
	}

	return false
}

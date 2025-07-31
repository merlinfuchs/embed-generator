package health

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
)

type HealthHandler struct {
	bot *bot.Bot
}

func New(bot *bot.Bot) *HealthHandler {
	return &HealthHandler{
		bot: bot,
	}
}

func (h *HealthHandler) HandleHealth(c *fiber.Ctx) error {
	return c.SendStatus(http.StatusOK)
}

func (h *HealthHandler) HandleHealthShardList(c *fiber.Ctx) error {
	rawGuildID := c.Query("guild_id")
	var guildID uint64
	if rawGuildID != "" {
		var err error
		guildID, err = strconv.ParseUint(rawGuildID, 10, 64)
		if err != nil {
			return c.SendStatus(http.StatusBadRequest)
		}
	}

	suspiciousOnly := c.Query("suspicious") == "true"

	shards := h.bot.ShardManager.ShardList()

	shardListWire := make([]wire.ShardWire, 0, len(shards))
	for _, shard := range shards {
		if guildID != 0 && guildID%uint64(h.bot.ShardManager.ShardCount) != uint64(shard.ID) {
			continue
		}

		if shard.Session == nil {
			shardListWire = append(shardListWire, wire.ShardWire{
				ID:         shard.ID,
				Suspicious: true,
			})
		} else {
			var suspicious bool
			if time.Since(shard.Session.LastHeartbeatAck) > 5*60*time.Second {
				suspicious = true
			}
			if time.Since(shard.Session.LastHeartbeatSent) > 5*time.Second && shard.Session.LastHeartbeatAck.Before(shard.Session.LastHeartbeatSent) {
				suspicious = true
			}

			if suspiciousOnly && !suspicious {
				continue
			}

			shardListWire = append(shardListWire, wire.ShardWire{
				ID:                     shard.ID,
				HasSession:             true,
				LastHeartbeatAck:       shard.Session.LastHeartbeatAck,
				LastHeartbeatSent:      shard.Session.LastHeartbeatSent,
				ShouldReconnectOnError: shard.Session.ShouldReconnectOnError,
				ShouldRetryOnRateLimit: shard.Session.ShouldRetryOnRateLimit,
				Suspicious:             suspicious,
			})
		}
	}

	return c.JSON(wire.ShardListWire{
		ShardCount: h.bot.ShardManager.ShardCount,
		Shards:     shardListWire,
	})
}

package sharding

import (
	"time"

	"github.com/rs/zerolog/log"
)

func (m *ShardManager) monitorShards() {
	ticker := time.NewTicker(time.Minute * 30)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			m.checkShards()
		case <-m.stopCh:
			return
		}
	}
}

func (m *ShardManager) checkShards() {
	m.RLock()
	defer m.RUnlock()

	log.Info().Msg("Checking for suspicious shards")

	for _, shard := range m.Shards {
		if shard.Session == nil {
			go m.restartShard(shard)
			continue
		}

		if time.Since(shard.Session.LastHeartbeatAck) > 15*time.Minute {
			go m.restartShard(shard)
			continue
		}

		if time.Since(shard.Session.LastHeartbeatSent) > 10*time.Second &&
			shard.Session.LastHeartbeatAck.Before(shard.Session.LastHeartbeatSent) {
			go m.restartShard(shard)
			continue
		}
	}
}

func (m *ShardManager) restartShard(shard *Shard) {
	log.Info().Int("shard_id", shard.ID).Msg("Restarting suspicious shard")

	if err := shard.Kill(); err != nil {
		log.Error().Err(err).Msg("Failed to stop suspicious shard for reconnect")
	}

	log.Info().Int("shard_id", shard.ID).Msg("Suspicious shard stopped")

	if err := shard.Start(m.token, m.Intents); err != nil {
		log.Error().Err(err).Msg("Failed to start suspicious shard for reconnect")
	}

	log.Info().Int("shard_id", shard.ID).Msg("Suspicious shard restarted")
}

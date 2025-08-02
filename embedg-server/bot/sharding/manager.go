package sharding

import (
	"strconv"
	"sync"
	"time"

	"github.com/merlinfuchs/discordgo"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

// Manager facilitates the management of Shards.
type ShardManager struct {
	sync.RWMutex

	// Discord gateway.
	Session *discordgo.Session
	// Discord intent.
	Intents discordgo.Intent
	// Shards managed by this Manager.
	Shards []*Shard
	// Total Shard count.
	ShardCount int
	// Number of shards that can identify concurrently.
	ShardConcurrency int

	State *discordgo.State

	Presence     *discordgo.GatewayStatusUpdate
	FirstShardID int
	LastShardID  int

	// Event handlers.
	handlers []interface{}

	// Discord bot token.
	token string

	stopped bool
	stopCh  chan struct{}
}

func (m *ShardManager) ShardList() []*Shard {
	m.RLock()
	defer m.RUnlock()

	return m.Shards
}

// AddHandler registers an event handler for all Shards.
func (m *ShardManager) AddHandler(handler interface{}) {
	m.Lock()
	defer m.Unlock()

	m.handlers = append(m.handlers, handler)

	for _, shard := range m.Shards {
		shard.AddHandler(handler)
	}
}

// GuildCount returns the amount of guilds that a Manager's Shards are
// handling.
func (m *ShardManager) GuildCount() (count int) {
	m.RLock()
	defer m.RUnlock()

	for _, shard := range m.Shards {
		count += shard.GuildCount()
	}

	return
}

// New creates a new Manager with the recommended number of shards.
// After calling New, call Start to begin connecting the shards.
//
// Example:
// mgr := shards.New("Bot TOKEN")
func New(token string) (cluster *ShardManager, err error) {
	// Initialize the Manager with provided bot token.
	cluster = &ShardManager{
		token:  token,
		stopCh: make(chan struct{}),
	}

	// Initialize the gateway.
	cluster.Session, err = discordgo.New(token)

	cluster.Session.LogLevel = viper.GetInt("discord.log_level")

	// Set recommended shard count.
	resp, err := cluster.Session.GatewayBot()
	if err != nil {
		return
	}

	if resp.Shards < 1 {
		cluster.ShardCount = 1
	} else {
		cluster.ShardCount = resp.Shards
	}

	if resp.SessionStartLimit.MaxConcurrency < 1 {
		cluster.ShardConcurrency = 1
	} else {
		cluster.ShardConcurrency = resp.SessionStartLimit.MaxConcurrency
	}

	if cluster.LastShardID == 0 {
		cluster.LastShardID = cluster.ShardCount - 1
	}

	return
}

// SetShardCount sets the shard count.
// The new shard count won't take effect until the Manager is restarted.
func (m *ShardManager) SetShardCount(count int) {
	m.Lock()
	defer m.Unlock()

	if count > 0 {
		m.ShardCount = count
	}
}

// SessionForDM returns the proper session for sending and receiving
// DM's.
func (m *ShardManager) SessionForDM() *discordgo.Session {
	m.RLock()
	defer m.RUnlock()

	// Per Discord documentation, Shard 0 is the only shard which can
	// send and receive DM's.
	//
	// See https://discord.com/developers/docs/topics/gateway#sharding
	return m.Shards[0].Session
}

// SessionForGuild returns the proper session for the specified guild.
func (m *ShardManager) SessionForGuild(guildID int64) *discordgo.Session {
	m.RLock()
	defer m.RUnlock()

	// Formula to determine which shard handles a guild, from Discord
	// docs.
	//
	// See https://discord.com/developers/docs/topics/gateway#sharding
	return m.Shards[(guildID>>22)%int64(m.ShardCount)].Session
}

// Restart restarts the Manager, and rescales if necessary, all with
// zero downtime.
func (m *ShardManager) Restart() (nMgr *ShardManager, err error) {
	// Lock the old Manager for reading.
	m.RLock()

	// Create a new Manager using our token.
	mgr, err := New(m.token)
	if err != nil {
		m.RUnlock()
		return m, err
	}

	mgr.FirstShardID = m.FirstShardID
	mgr.LastShardID = m.LastShardID
	mgr.ShardCount = m.ShardCount
	mgr.ShardConcurrency = m.ShardConcurrency
	mgr.Intents = m.Intents

	// We have no need to lock the old Manager at this point, and
	// starting the new one will take some time.
	m.RUnlock()

	// Start the new Manager so that it can begin handling events.
	err = mgr.Start()
	if err != nil {
		return m, err
	}

	// Apply the same handlers.
	for _, handler := range m.handlers {
		mgr.AddHandler(handler)
	}

	// Shutdown the old Manager. The new Manager is already handling
	// events.
	m.Shutdown()

	return mgr, nil
}

// Start starts the Manager.
func (m *ShardManager) Start() (err error) {
	m.Lock()
	defer m.Unlock()

	// Initialize Shards.
	m.Shards = []*Shard{}
	for i := m.FirstShardID; i <= m.LastShardID; i++ {
		m.Shards = append(m.Shards, &Shard{
			ID:         i,
			ShardCount: m.ShardCount,
			Presence:   m.Presence,
			State:      m.State,
		})
	}

	// Start Shards concurrently if allowed.
	// TODO: fix shutdown and locking mechanism
	for d := 0; d < m.ShardConcurrency; d++ {
		go func(divider int) {
			// Add event handlers to Shards and connect them.
			for id, shard := range m.Shards {
				if m.stopped {
					return
				}

				if id%m.ShardConcurrency != divider {
					continue
				}

				// Add handlers to this shard.
				for _, handler := range m.handlers {
					shard.AddHandler(handler)
				}
				// Connect shard.
				err = shard.Start(m.token, m.Intents)
				if err != nil {
					log.Error().Err(err).Msg("error starting shard")
					return
				}
				// Ratelimit shard connections.
				if id != len(m.Shards)-1 {
					time.Sleep(time.Second * 5)
				}
			}
		}(d)
	}

	go m.monitorShards()
	return
}

// Shutdown gracefully terminates the Manager.
func (m *ShardManager) Shutdown() {
	m.Lock()
	defer m.Unlock()

	m.stopped = true
	close(m.stopCh)

	wg := sync.WaitGroup{}
	for _, shard := range m.Shards {
		wg.Add(1)
		go func(s *Shard) {
			if err := s.Stop(); err != nil {
				log.Error().Err(err).Msg("error stopping shard")
			}
			wg.Done()
		}(shard)
	}

	wg.Wait()
}

func (m *ShardManager) ShardForGuild(guildID string) *Shard {
	gid, _ := strconv.ParseUint(guildID, 10, 64)
	shardID := (gid >> 22) % uint64(m.ShardCount)

	for _, shard := range m.Shards {
		if shard.ID == int(shardID) {
			return shard
		}
	}
	return nil
}

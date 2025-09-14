package sharding

import (
	"sync"

	"github.com/merlinfuchs/discordgo"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

// A Shard represents a shard.
type Shard struct {
	sync.RWMutex

	// The Discord session handling this Shard.
	Session *discordgo.Session
	// This Shard's ID.
	ID int
	// Total Shard count.
	ShardCount int
	Presence   *discordgo.GatewayStatusUpdate

	// Event handlers.
	handlers []interface{}
}

// AddHandler registers an event handler for a Shard.
//
// Shouldn't be called after Init or results in undefined behavior.
func (s *Shard) AddHandler(handler interface{}) {
	s.Lock()
	defer s.Unlock()

	s.handlers = append(s.handlers, handler)
}

// GuildCount returns the amount of guilds that a Shard is handling.
func (s *Shard) GuildCount() (count int) {
	s.RLock()
	defer s.RUnlock()

	if s.Session != nil {
		s.Session.State.RLock()
		count += len(s.Session.State.Guilds)
		s.Session.State.RUnlock()
	}

	return
}

// Init initializes a shard with a bot token, its Shard ID, the total
// amount of shards, and a Discord intent.
func (s *Shard) Start(token string, intent discordgo.Intent) (err error) {
	s.Lock()
	defer s.Unlock()

	// Create the session.
	s.Session, err = discordgo.New(token)
	if err != nil {
		return
	}

	s.Session.LogLevel = viper.GetInt("discord.log_level")

	s.Session.SyncEvents = false

	// Shard the session.
	s.Session.ShardCount = s.ShardCount
	s.Session.ShardID = s.ID

	// Identify our intent.
	s.Session.Identify.Intents = intent

	// State is handled outside of the shard
	s.Session.StateEnabled = false

	if s.Presence != nil {
		s.Session.Identify.Presence = *s.Presence
	}

	// Add handlers to the session.
	for _, handler := range s.handlers {
		s.Session.AddHandler(handler)
	}

	// Connect the shard.
	err = s.Session.Open()

	return
}

// Stop stops a shard.
func (s *Shard) Stop() (err error) {
	s.Lock()
	defer s.Unlock()

	// Close the session.
	if s.Session != nil {
		err = s.Session.Close()
	}

	return
}

func (s *Shard) Kill() (err error) {
	log.Info().Int("shard_id", s.ID).Msg("Killing shard")
	s.Lock()
	defer s.Unlock()
	log.Info().Int("shard_id", s.ID).Msg("Shard locked")

	if s.Session != nil {
		err = s.Session.Kill()
	}

	log.Info().Int("shard_id", s.ID).Msg("Shard killed")

	return
}

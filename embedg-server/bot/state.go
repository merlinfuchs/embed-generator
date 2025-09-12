package bot

import "sync"

type State struct {
	sync.RWMutex
	guildIDs map[string]struct{}
}

func NewState() *State {
	return &State{
		guildIDs: make(map[string]struct{}),
	}
}

func (s *State) AddGuilds(guildIDs ...string) {
	s.Lock()
	defer s.Unlock()
	for _, guildID := range guildIDs {
		s.guildIDs[guildID] = struct{}{}
	}
}

func (s *State) RemoveGuilds(guildIDs ...string) {
	s.Lock()
	defer s.Unlock()
	for _, guildID := range guildIDs {
		delete(s.guildIDs, guildID)
	}
}

func (s *State) HasGuild(guildID string) bool {
	s.RLock()
	defer s.RUnlock()
	_, ok := s.guildIDs[guildID]
	return ok
}

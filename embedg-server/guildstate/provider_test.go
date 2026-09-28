package guildstate

import (
	"testing"
	"time"

	"github.com/disgoorg/disgo/events"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
)

// If reads extended the entry, a guild in use would only ever refresh on a gateway event, and a
// cached not-found would last for as long as someone keeps asking.
func TestGuildReadsDontExtendExpiry(t *testing.T) {
	p := New(nil)

	key := guildKey(common.ID(1))
	expiresAt := p.guilds.Set(key, &State{}, 0).ExpiresAt()

	time.Sleep(10 * time.Millisecond)

	item := p.guilds.Get(key)
	if item == nil {
		t.Fatal("state not cached")
	}
	if !item.ExpiresAt().Equal(expiresAt) {
		t.Errorf("read moved expiry from %v to %v", expiresAt, item.ExpiresAt())
	}
}

// The not-found cached while the bot was out of the guild has to go when it joins again.
func TestGuildJoinDropsCachedNotFound(t *testing.T) {
	p := New(nil)

	guildID := common.ID(1)
	p.guilds.Set(guildKey(guildID), nil, 0)
	p.threads.Set(threadsKey(guildID), nil, 0)

	p.OnEvent(&events.GuildJoin{
		GenericGuild: &events.GenericGuild{GuildID: guildID},
	})

	if p.guilds.Has(guildKey(guildID)) {
		t.Error("guild still cached after the bot joined")
	}
	if p.threads.Has(threadsKey(guildID)) {
		t.Error("threads still cached after the bot joined")
	}
}

package rest

import (
	"context"
	"testing"
	"time"

	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
)

// Permission checks read the bot's member on every request. If reads extended the entry, a guild
// in use would keep the member it was first fetched with and never see the bot's roles change.
func TestMemberCacheReadsDontExtendExpiry(t *testing.T) {
	client := NewRestClient("")
	defer client.Close(context.Background())

	key := memberCacheKey(common.ID(1), common.ID(2))
	expiresAt := client.memberCache.Set(key, &discord.Member{}, 0).ExpiresAt()

	time.Sleep(10 * time.Millisecond)

	item := client.memberCache.Get(key)
	if item == nil {
		t.Fatal("member not cached")
	}
	if !item.ExpiresAt().Equal(expiresAt) {
		t.Errorf("read moved expiry from %v to %v", expiresAt, item.ExpiresAt())
	}
}

// A rejoin gives the bot a new managed role. A member cached before it still lists the deleted
// role, which leaves the bot with only @everyone's permissions.
func TestOnEventDropsBotMemberOnRejoin(t *testing.T) {
	client := NewRestClient("")
	defer client.Close(context.Background())

	guildID, botID := common.ID(1), common.ID(2)
	client.memberCache.Set(memberCacheKey(guildID, botID), &discord.Member{}, 0)

	client.OnEvent(&events.GuildJoin{
		GenericGuild: &events.GenericGuild{
			GenericEvent: events.NewGenericEvent(&bot.Client{ApplicationID: botID}, 0, 0),
			GuildID:      guildID,
		},
	})

	if client.memberCache.Has(memberCacheKey(guildID, botID)) {
		t.Error("bot member still cached after the bot rejoined")
	}
}

package guild

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"gopkg.in/guregu/null.v4"
)

const (
	flushInterval = 2 * time.Second
	batchSize     = 1000
	writeTimeout  = 30 * time.Second
)

// GuildTracker keeps the guilds table in sync with the gateway. Guild creates arrive in bulk on
// every (re)connect, one per guild the bot is in, so they are buffered and written in batches.
type GuildTracker struct {
	store store.GuildStore

	mutex  sync.Mutex
	buffer map[common.ID]model.Guild
}

func NewGuildTracker(store store.GuildStore) *GuildTracker {
	return &GuildTracker{
		store:  store,
		buffer: make(map[common.ID]model.Guild),
	}
}

func (t *GuildTracker) OnEvent(event bot.Event) {
	switch e := event.(type) {
	case *events.GuildReady:
		t.enqueue(e.Guild.Guild)
	case *events.GuildJoin:
		t.enqueue(e.Guild.Guild)
	case *events.GuildUpdate:
		t.enqueue(e.Guild)
	case *events.GuildLeave:
		t.markLeft(e.GuildID)
	}
}

// Run empties the buffer every flushInterval.
func (t *GuildTracker) Run(ctx context.Context) {
	ticker := time.NewTicker(flushInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			t.drain(context.WithoutCancel(ctx))
			return
		case <-ticker.C:
			t.drain(ctx)
		}
	}
}

// drain writes the buffer out in batches until nothing is left.
func (t *GuildTracker) drain(ctx context.Context) {
	for t.flush(ctx) {
	}
}

func (t *GuildTracker) enqueue(guild discord.Guild) {
	t.mutex.Lock()
	defer t.mutex.Unlock()

	t.buffer[guild.ID] = model.Guild{
		ID:      guild.ID,
		Name:    guild.Name,
		Icon:    null.StringFromPtr(guild.Icon),
		OwnerID: guild.OwnerID,
	}
}

// flush writes at most batchSize guilds and reports whether the buffer still holds more.
// A reconnect fills the buffer faster than postgres drains it, so the cap keeps one statement
// from growing to the full 250k guilds.
func (t *GuildTracker) flush(ctx context.Context) bool {
	t.mutex.Lock()
	guilds := make([]model.Guild, 0, min(len(t.buffer), batchSize))
	for id, guild := range t.buffer {
		if len(guilds) == batchSize {
			break
		}
		guilds = append(guilds, guild)
		delete(t.buffer, id)
	}
	more := len(t.buffer) != 0
	t.mutex.Unlock()

	if len(guilds) == 0 {
		return false
	}

	ctx, cancel := context.WithTimeout(ctx, writeTimeout)
	defer cancel()

	if err := t.store.UpsertGuilds(ctx, guilds, time.Now().UTC()); err != nil {
		slog.Error(
			"Failed to upsert guilds",
			slog.Int("count", len(guilds)),
			slog.Any("error", err),
		)
	}

	return more
}

func (t *GuildTracker) markLeft(guildID common.ID) {
	t.mutex.Lock()
	delete(t.buffer, guildID)
	t.mutex.Unlock()

	ctx, cancel := context.WithTimeout(context.Background(), writeTimeout)
	defer cancel()

	if err := t.store.MarkGuildLeft(ctx, guildID, time.Now().UTC()); err != nil {
		slog.Error(
			"Failed to mark guild as left",
			slog.String("guild_id", guildID.String()),
			slog.Any("error", err),
		)
	}
}

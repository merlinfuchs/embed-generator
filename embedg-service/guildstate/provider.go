package guildstate

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"golang.org/x/sync/errgroup"
	"golang.org/x/sync/singleflight"
)

const (
	// stateTTL bounds how stale a non-owner instance can be. The owner instance invalidates on the
	// matching gateway event, so it sees changes immediately.
	stateTTL = 2 * time.Minute

	// The whole point of dropping the gateway cache is not holding every guild in memory, so both
	// caches are capped and evict least recently used rather than growing to the guild count.
	guildCapacity   = 10_000
	channelCapacity = 50_000
)

// State is everything guild scoped that permission checks and templates read. There is no gateway
// cache to read it from, so it comes from REST behind a short TTL.
type State struct {
	Guild    discord.Guild
	Channels []discord.GuildChannel
	Roles    []discord.Role
}

type Provider struct {
	rest rest.Rest

	singleFlight singleflight.Group
	guilds       *ttlcache.Cache[string, *State]
	channels     *ttlcache.Cache[string, discord.GuildChannel]
}

func New(rest rest.Rest) *Provider {
	guilds := ttlcache.New(
		ttlcache.WithTTL[string, *State](stateTTL),
		ttlcache.WithCapacity[string, *State](guildCapacity),
	)
	go guilds.Start()

	channels := ttlcache.New(
		ttlcache.WithTTL[string, discord.GuildChannel](stateTTL),
		ttlcache.WithCapacity[string, discord.GuildChannel](channelCapacity),
	)
	go channels.Start()

	return &Provider{
		rest:     rest,
		guilds:   guilds,
		channels: channels,
	}
}

// Guild returns the guild with its channels and roles. Returns store.ErrNotFound if the bot can't
// see the guild.
func (p *Provider) Guild(ctx context.Context, guildID common.ID) (*State, error) {
	// A nil state is cached on purpose, so a guild the bot was kicked from costs one lookup per TTL
	// instead of three REST calls per request.
	state, err := common.GetOrSet(&p.singleFlight, guildKey(guildID), p.guilds, func() (*State, error) {
		state := &State{}

		group, ctx := errgroup.WithContext(ctx)
		group.Go(func() error {
			guild, err := p.rest.GetGuild(guildID, false, rest.WithCtx(ctx))
			if err != nil {
				return fmt.Errorf("failed to get guild: %w", err)
			}
			state.Guild = guild.Guild
			return nil
		})
		group.Go(func() error {
			channels, err := p.rest.GetGuildChannels(guildID, rest.WithCtx(ctx))
			if err != nil {
				return fmt.Errorf("failed to get guild channels: %w", err)
			}
			state.Channels = channels
			return nil
		})
		group.Go(func() error {
			roles, err := p.rest.GetRoles(guildID, rest.WithCtx(ctx))
			if err != nil {
				return fmt.Errorf("failed to get guild roles: %w", err)
			}
			state.Roles = roles
			return nil
		})

		if err := group.Wait(); err != nil {
			if isGone(err) {
				return nil, nil
			}
			return nil, err
		}

		return state, nil
	})
	if err != nil {
		return nil, err
	}
	if state == nil {
		return nil, store.ErrNotFound
	}

	return state, nil
}

// Channel returns a single channel without loading the rest of the guild, for the many call sites
// that only have a channel id. Threads are included, unlike the guild's channel list.
func (p *Provider) Channel(ctx context.Context, channelID common.ID) (discord.GuildChannel, error) {
	channel, err := common.GetOrSet(&p.singleFlight, channelKey(channelID), p.channels, func() (discord.GuildChannel, error) {
		channel, err := p.rest.GetChannel(channelID, rest.WithCtx(ctx))
		if err != nil {
			if isGone(err) {
				return nil, nil
			}
			return nil, fmt.Errorf("failed to get channel: %w", err)
		}

		guildChannel, ok := channel.(discord.GuildChannel)
		if !ok {
			return nil, nil
		}

		return guildChannel, nil
	})
	if err != nil {
		return nil, err
	}
	if channel == nil {
		return nil, store.ErrNotFound
	}

	return channel, nil
}

// Invalidate drops the cached guild so the next read sees the change. Cheap on purpose: the bot is
// in hundreds of thousands of guilds, so this must not scan anything.
func (p *Provider) Invalidate(guildID common.ID) {
	p.guilds.Delete(guildKey(guildID))
}

func (p *Provider) InvalidateChannel(channelID common.ID) {
	p.channels.Delete(channelKey(channelID))
}

func isGone(err error) bool {
	return common.IsDiscordRestStatusCode(err, http.StatusNotFound, http.StatusForbidden)
}

// The prefixes matter: both caches share one singleflight group, and in guilds created before 2017
// the default channel's id equals the guild id.
func guildKey(guildID common.ID) string {
	return "guild:" + guildID.String()
}

func channelKey(channelID common.ID) string {
	return "channel:" + channelID.String()
}

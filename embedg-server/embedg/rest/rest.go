package rest

import (
	"context"
	"fmt"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/snowflake/v2"
	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"golang.org/x/sync/singleflight"
)

var ProxyURL string

// clientCache holds one client per token. Every client owns a member cache with a janitor
// goroutine, so building one per request leaked a goroutine each time and the cache never lived
// long enough to serve anyone. Idle tokens fall out after an hour and their client is stopped.
var (
	clientCache = newClientCache()
	clientGroup singleflight.Group
)

const (
	// One entry per custom bot that has been active in the last hour.
	clientCapacity = 1_000
	// Shared across every guild a bot is in now that a client outlives the request.
	memberCapacity = 10_000
)

func newClientCache() *ttlcache.Cache[string, *RestClient] {
	cache := ttlcache.New(
		ttlcache.WithTTL[string, *RestClient](time.Hour),
		ttlcache.WithCapacity[string, *RestClient](clientCapacity),
	)
	cache.OnEviction(func(_ context.Context, _ ttlcache.EvictionReason, item *ttlcache.Item[string, *RestClient]) {
		item.Value().Close(context.Background())
	})
	go cache.Start()
	return cache
}

// ClientForToken returns the shared client for a bot token, building one on first use. Use this for
// tokens that keep coming back, and NewRestClient with a Close for one off calls.
func ClientForToken(token string, opts ...rest.ClientConfigOpt) *RestClient {
	client, _ := common.GetOrSet(&clientGroup, token, clientCache, func() (*RestClient, error) {
		return NewRestClient(token, opts...), nil
	})
	return client
}

type RestClient struct {
	rest.Rest

	memberCache  *ttlcache.Cache[string, *discord.Member]
	singleFlight singleflight.Group
}

func NewRestClient(token string, opts ...rest.ClientConfigOpt) *RestClient {
	memberCache := ttlcache.New(
		ttlcache.WithTTL[string, *discord.Member](5*time.Minute),
		ttlcache.WithCapacity[string, *discord.Member](memberCapacity),
	)
	go memberCache.Start()

	if ProxyURL != "" {
		opts = append(opts, rest.WithURL(ProxyURL))
	}

	return &RestClient{
		Rest:        rest.New(rest.NewClient(token, opts...)),
		memberCache: memberCache,
	}
}

func (c *RestClient) GetMember(guildID snowflake.ID, userID snowflake.ID, opts ...rest.RequestOpt) (*discord.Member, error) {
	key := memberCacheKey(guildID, userID)

	return common.GetOrSet(&c.singleFlight, key, c.memberCache, func() (*discord.Member, error) {
		member, err := c.Rest.GetMember(guildID, userID, opts...)
		if err != nil {
			return nil, err
		}
		return member, nil
	})
}

// Close stops the member cache's janitor goroutine on top of what the embedded client does. A
// client that is never closed keeps that goroutine forever.
func (c *RestClient) Close(ctx context.Context) {
	c.memberCache.Stop()
	c.Rest.Close(ctx)
}

func memberCacheKey(guildID common.ID, userID common.ID) string {
	return fmt.Sprintf("%s:%s", guildID.String(), userID.String())
}

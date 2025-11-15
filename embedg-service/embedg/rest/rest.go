package rest

import (
	"fmt"
	"sync"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/snowflake/v2"
	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
)

type RestClient struct {
	rest.Rest

	memberCache *ttlcache.Cache[string, *discord.Member]

	// Single mutex to protect all pending request maps
	pendingMutex sync.RWMutex
	pendingReqs  map[string]*pendingRequest
}

func NewRestClient(token string, opts ...rest.ConfigOpt) *RestClient {
	memberCache := ttlcache.New(
		ttlcache.WithTTL[string, *discord.Member](5 * time.Minute),
	)
	go memberCache.Start()

	return &RestClient{
		Rest:        rest.New(rest.NewClient(token, opts...)),
		memberCache: memberCache,
		pendingReqs: make(map[string]*pendingRequest),
	}
}

func (c *RestClient) GetMember(guildID snowflake.ID, userID snowflake.ID, opts ...rest.RequestOpt) (*discord.Member, error) {
	key := memberCacheKey(guildID, userID)

	return getOrSet(c, key, c.memberCache, func() (*discord.Member, error) {
		member, err := c.Rest.GetMember(guildID, userID, opts...)
		if err != nil {
			return nil, err
		}
		return member, nil
	})
}

func memberCacheKey(guildID common.ID, userID common.ID) string {
	return fmt.Sprintf("%s:%s", guildID.String(), userID.String())
}

// pendingRequest represents an ongoing request for a specific cache key
type pendingRequest struct {
	waitGroup sync.WaitGroup
	result    interface{}
	err       error
}

// getOrSet executes a fetch function with concurrency control
func getOrSet[T any](c *RestClient, cacheKey string, cache *ttlcache.Cache[string, T], fetchFunc func() (T, error)) (T, error) {
	var zero T

	// Check cache first
	cacheItem := cache.Get(cacheKey)
	if cacheItem != nil {
		return cacheItem.Value(), nil
	}

	// Check if there's already a pending request
	c.pendingMutex.Lock()
	if pending, exists := c.pendingReqs[cacheKey]; exists {
		c.pendingMutex.Unlock()
		pending.waitGroup.Wait()
		if pending.err != nil {
			return zero, pending.err
		}
		return pending.result.(T), nil
	}

	// Create new pending request
	pending := &pendingRequest{}
	pending.waitGroup.Add(1)
	c.pendingReqs[cacheKey] = pending
	c.pendingMutex.Unlock()

	// Perform the actual request
	result, err := fetchFunc()

	// Clean up pending request and set result
	c.pendingMutex.Lock()
	delete(c.pendingReqs, cacheKey)
	c.pendingMutex.Unlock()

	pending.result = result
	pending.err = err
	pending.waitGroup.Done()

	if err != nil {
		return zero, err
	}

	cache.Set(cacheKey, result, 0)
	return result, nil
}

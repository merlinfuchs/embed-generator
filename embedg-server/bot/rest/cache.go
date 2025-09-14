package rest

import (
	"context"
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

func memberCacheKey(guildID string, userID string) string {
	return fmt.Sprintf("member:%s:%s", guildID, userID)
}

// pendingRequest represents an ongoing request for a specific cache key
type pendingRequest struct {
	waitGroup sync.WaitGroup
	result    interface{}
	err       error
}

type RestClientWithCache struct {
	session *discordgo.Session

	memberCache *ttlcache.Cache[string, *discordgo.Member]

	// Single mutex to protect all pending request maps
	pendingMutex sync.RWMutex
	pendingReqs  map[string]*pendingRequest
}

func NewRestClientWithCache(session *discordgo.Session) *RestClientWithCache {
	rest := &RestClientWithCache{
		session:     session,
		memberCache: ttlcache.New(ttlcache.WithTTL[string, *discordgo.Member](5 * time.Minute)),
		pendingReqs: make(map[string]*pendingRequest),
	}

	go rest.memberCache.Start()

	return rest
}

// getOrSet executes a fetch function with concurrency control
func getOrSet[T any](c *RestClientWithCache, cacheKey string, cache *ttlcache.Cache[string, T], fetchFunc func() (T, error)) (T, error) {
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

func (c *RestClientWithCache) Request(ctx context.Context, method string, url string, body io.Reader, options ...discordgo.RequestOption) ([]byte, error) {
	options = append(options, discordgo.WithContext(ctx))
	return c.session.Request(method, url, body, options...)
}

func (c *RestClientWithCache) GuildMember(ctx context.Context, guildID string, userID string) (*discordgo.Member, error) {
	return getOrSet(c, memberCacheKey(guildID, userID), c.memberCache, func() (*discordgo.Member, error) {
		member, err := c.session.GuildMember(guildID, userID, discordgo.WithContext(ctx))
		if err != nil {
			if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownMember, discordgo.ErrCodeUnknownGuild, discordgo.ErrCodeMissingAccess) {
				return nil, ErrNotFound
			}
			return nil, err
		}
		return member, nil
	})
}

func (c *RestClientWithCache) InvalidateMemberCache(guildID string, userID string) {
	c.memberCache.Delete(memberCacheKey(guildID, userID))
}

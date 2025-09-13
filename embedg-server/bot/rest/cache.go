package rest

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"golang.org/x/oauth2"
)

func guildCacheKey(guildID string) string {
	return fmt.Sprintf("guild:%s", guildID)
}

func guildChannelsCacheKey(guildID string) string {
	return fmt.Sprintf("guildChannels:%s", guildID)
}

func guildThreadsCacheKey(guildID string) string {
	return fmt.Sprintf("guildThreads:%s", guildID)
}

func guildRolesCacheKey(guildID string) string {
	return fmt.Sprintf("guildRoles:%s", guildID)
}

func channelCacheKey(channelID string) string {
	return fmt.Sprintf("channel:%s", channelID)
}

func oauthUserCacheKey(accessToken string) string {
	return fmt.Sprintf("oauthUser:%s", accessToken)
}

func oauthUserGuildsCacheKey(accessToken string) string {
	return fmt.Sprintf("oauthUserGuilds:%s", accessToken)
}

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

	oauthGuildsCache     *ttlcache.Cache[string, []*discordgo.Guild]
	guildCache           *ttlcache.Cache[string, *discordgo.Guild]
	channelCache         *ttlcache.Cache[string, *discordgo.Channel]
	guildChannelCache    *ttlcache.Cache[string, []*discordgo.Channel]
	guildThreadsCache    *ttlcache.Cache[string, []*discordgo.Channel]
	memberCache          *ttlcache.Cache[string, *discordgo.Member]
	oauthUserCache       *ttlcache.Cache[string, *discordgo.User]
	oauthUserGuildsCache *ttlcache.Cache[string, []*OauthUserGuild]

	// Single mutex to protect all pending request maps
	pendingMutex sync.RWMutex
	pendingReqs  map[string]*pendingRequest
}

func NewRestClientWithCache(session *discordgo.Session) *RestClientWithCache {
	rest := &RestClientWithCache{
		session:              session,
		oauthGuildsCache:     ttlcache.New(ttlcache.WithTTL[string, []*discordgo.Guild](5 * time.Minute)),
		guildCache:           ttlcache.New(ttlcache.WithTTL[string, *discordgo.Guild](3 * time.Minute)),
		channelCache:         ttlcache.New(ttlcache.WithTTL[string, *discordgo.Channel](3 * time.Minute)),
		guildChannelCache:    ttlcache.New(ttlcache.WithTTL[string, []*discordgo.Channel](3 * time.Minute)),
		guildThreadsCache:    ttlcache.New(ttlcache.WithTTL[string, []*discordgo.Channel](3 * time.Minute)),
		memberCache:          ttlcache.New(ttlcache.WithTTL[string, *discordgo.Member](3 * time.Minute)),
		oauthUserCache:       ttlcache.New(ttlcache.WithTTL[string, *discordgo.User](3 * time.Minute)),
		oauthUserGuildsCache: ttlcache.New(ttlcache.WithTTL[string, []*OauthUserGuild](3 * time.Minute)),
		pendingReqs:          make(map[string]*pendingRequest),
	}

	go rest.oauthGuildsCache.Start()
	go rest.guildCache.Start()
	go rest.channelCache.Start()
	go rest.guildChannelCache.Start()
	go rest.guildThreadsCache.Start()
	go rest.memberCache.Start()
	go rest.oauthUserCache.Start()
	go rest.oauthUserGuildsCache.Start()

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

func (c *RestClientWithCache) Guild(ctx context.Context, guildID string) (*discordgo.Guild, error) {
	return getOrSet(c, guildCacheKey(guildID), c.guildCache, func() (*discordgo.Guild, error) {
		guild, err := c.session.Guild(guildID)
		if err != nil {
			if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownGuild, discordgo.ErrCodeMissingAccess) {
				return nil, ErrNotFound
			}
			return nil, err
		}
		return guild, nil
	})
}

func (c *RestClientWithCache) GuildChannels(ctx context.Context, guildID string) ([]*discordgo.Channel, error) {
	return getOrSet(c, guildChannelsCacheKey(guildID), c.guildChannelCache, func() ([]*discordgo.Channel, error) {
		channels, err := c.session.GuildChannels(guildID, discordgo.WithContext(ctx))
		if err != nil {
			if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownGuild, discordgo.ErrCodeMissingAccess) {
				return nil, ErrNotFound
			}
			return nil, err
		}

		// Cache individual channels
		for _, channel := range channels {
			c.channelCache.Set(channel.ID, channel, 0)
		}

		return channels, nil
	})
}

func (c *RestClientWithCache) Channel(ctx context.Context, channelID string) (*discordgo.Channel, error) {
	return getOrSet(c, channelCacheKey(channelID), c.channelCache, func() (*discordgo.Channel, error) {
		channel, err := c.session.Channel(channelID, discordgo.WithContext(ctx))
		if err != nil {
			if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownChannel, discordgo.ErrCodeMissingAccess) {
				return nil, ErrNotFound
			}
			return nil, err
		}
		return channel, nil
	})
}

func (c *RestClientWithCache) GuildThreads(ctx context.Context, guildID string) ([]*discordgo.Channel, error) {
	return getOrSet(c, guildThreadsCacheKey(guildID), c.guildThreadsCache, func() ([]*discordgo.Channel, error) {
		// TODO: Paginate
		res, err := c.session.GuildThreadsActive(guildID, discordgo.WithContext(ctx))
		if err != nil {
			if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownGuild, discordgo.ErrCodeMissingAccess) {
				return nil, ErrNotFound
			}
			return nil, err
		}
		return res.Threads, nil
	})
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

func (c *RestClientWithCache) GuildRoles(ctx context.Context, guildID string) ([]*discordgo.Role, error) {
	guild, err := c.Guild(ctx, guildID)
	if err != nil {
		return nil, err
	}

	return guild.Roles, nil
}

func (c *RestClientWithCache) GuildRole(ctx context.Context, guildID string, roleID string) (*discordgo.Role, error) {
	roles, err := c.GuildRoles(ctx, guildID)
	if err != nil {
		if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownGuild, discordgo.ErrCodeMissingAccess) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	for _, role := range roles {
		if role.ID == roleID {
			return role, nil
		}
	}

	return nil, ErrNotFound
}

func (c *RestClientWithCache) OauthUser(ctx context.Context, accessToken string) (*discordgo.User, error) {
	return getOrSet(c, oauthUserCacheKey(accessToken), c.oauthUserCache, func() (*discordgo.User, error) {
		client := (&oauth2.Config{}).Client(ctx, &oauth2.Token{AccessToken: accessToken})

		resp, err := client.Get("https://discord.com/api/users/@me")
		if err != nil {
			return nil, err
		}

		var user *discordgo.User
		err = json.NewDecoder(resp.Body).Decode(&user)
		if err != nil {
			return nil, err
		}

		return user, nil
	})
}

func (c *RestClientWithCache) OauthUserGuilds(ctx context.Context, accessToken string) ([]*OauthUserGuild, error) {
	return getOrSet(c, oauthUserGuildsCacheKey(accessToken), c.oauthUserGuildsCache, func() ([]*OauthUserGuild, error) {
		client := (&oauth2.Config{}).Client(ctx, &oauth2.Token{AccessToken: accessToken})

		resp, err := client.Get("https://discord.com/api/users/@me/guilds")
		if err != nil {
			return nil, err
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}
		resp.Body.Close()
		resp.Body = io.NopCloser(bytes.NewReader(body))

		var guilds []*OauthUserGuild
		err = json.NewDecoder(resp.Body).Decode(&guilds)
		if err != nil {
			return nil, err
		}

		return guilds, nil
	})
}

func (c *RestClientWithCache) OauthUserGuild(ctx context.Context, accessToken string, guildID string) (*OauthUserGuild, error) {
	guilds, err := c.OauthUserGuilds(ctx, accessToken)
	if err != nil {
		return nil, err
	}

	for _, guild := range guilds {
		if guild.ID == guildID {
			return guild, nil
		}
	}

	return nil, ErrNotFound
}

func (c *RestClientWithCache) InvalidateGuildCache(guildID string) {
	c.guildCache.Delete(guildCacheKey(guildID))
}

func (c *RestClientWithCache) InvalidateGuildChannelsCache(guildID string) {
	c.guildChannelCache.Delete(guildChannelsCacheKey(guildID))
}

func (c *RestClientWithCache) InvalidateGuildThreadsCache(guildID string) {
	c.guildThreadsCache.Delete(guildThreadsCacheKey(guildID))
}

func (c *RestClientWithCache) InvalidateChannelCache(channelID string) {
	c.channelCache.Delete(channelCacheKey(channelID))
}

func (c *RestClientWithCache) InvalidateMemberCache(guildID string, userID string) {
	c.memberCache.Delete(memberCacheKey(guildID, userID))
}

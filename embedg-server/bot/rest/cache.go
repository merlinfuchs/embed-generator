package rest

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"time"

	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"golang.org/x/oauth2"
)

type memberCacheKey struct {
	guildID string
	userID  string
}

type oauthGuildsCacheKey string

type guildCacheKey string

type channelCacheKey string

type guildChannelsCacheKey string

type guildThreadsCacheKey string

type guildRolesCacheKey string

type oauthUserCacheKey string

type oauthUserGuildsCacheKey string

type RestClientWithCache struct {
	session *discordgo.Session

	oauthGuildsCache     *ttlcache.Cache[oauthGuildsCacheKey, []*discordgo.Guild]
	guildCache           *ttlcache.Cache[guildCacheKey, *discordgo.Guild]
	channelCache         *ttlcache.Cache[channelCacheKey, *discordgo.Channel]
	guildChannelCache    *ttlcache.Cache[guildChannelsCacheKey, []*discordgo.Channel]
	guildThreadsCache    *ttlcache.Cache[guildThreadsCacheKey, []*discordgo.Channel]
	guildRolesCache      *ttlcache.Cache[guildRolesCacheKey, []*discordgo.Role]
	memberCache          *ttlcache.Cache[memberCacheKey, *discordgo.Member]
	oauthUserCache       *ttlcache.Cache[oauthUserCacheKey, *discordgo.User]
	oauthUserGuildsCache *ttlcache.Cache[oauthUserGuildsCacheKey, []*OauthUserGuild]
}

func NewRestClientWithCache(session *discordgo.Session) *RestClientWithCache {
	rest := &RestClientWithCache{
		session:              session,
		oauthGuildsCache:     ttlcache.New(ttlcache.WithTTL[oauthGuildsCacheKey, []*discordgo.Guild](5 * time.Minute)),
		guildCache:           ttlcache.New(ttlcache.WithTTL[guildCacheKey, *discordgo.Guild](15 * time.Minute)),
		channelCache:         ttlcache.New(ttlcache.WithTTL[channelCacheKey, *discordgo.Channel](3 * time.Minute)),
		guildChannelCache:    ttlcache.New(ttlcache.WithTTL[guildChannelsCacheKey, []*discordgo.Channel](3 * time.Minute)),
		guildThreadsCache:    ttlcache.New(ttlcache.WithTTL[guildThreadsCacheKey, []*discordgo.Channel](3 * time.Minute)),
		guildRolesCache:      ttlcache.New(ttlcache.WithTTL[guildRolesCacheKey, []*discordgo.Role](3 * time.Minute)),
		memberCache:          ttlcache.New(ttlcache.WithTTL[memberCacheKey, *discordgo.Member](3 * time.Minute)),
		oauthUserCache:       ttlcache.New(ttlcache.WithTTL[oauthUserCacheKey, *discordgo.User](3 * time.Minute)),
		oauthUserGuildsCache: ttlcache.New(ttlcache.WithTTL[oauthUserGuildsCacheKey, []*OauthUserGuild](3 * time.Minute)),
	}

	go rest.oauthGuildsCache.Start()
	go rest.guildCache.Start()
	go rest.channelCache.Start()
	go rest.guildChannelCache.Start()
	go rest.guildThreadsCache.Start()
	go rest.guildRolesCache.Start()
	go rest.memberCache.Start()
	go rest.oauthUserCache.Start()
	go rest.oauthUserGuildsCache.Start()

	return rest
}

func (c *RestClientWithCache) Request(ctx context.Context, method string, url string, body io.Reader, options ...discordgo.RequestOption) ([]byte, error) {
	options = append(options, discordgo.WithContext(ctx))
	return c.session.Request(method, url, body, options...)
}

func (c *RestClientWithCache) Guild(ctx context.Context, guildID string) (*discordgo.Guild, error) {
	cacheKey := guildCacheKey(guildID)
	cacheItem := c.guildCache.Get(cacheKey)
	if cacheItem != nil {
		return cacheItem.Value(), nil
	}

	guild, err := c.session.Guild(guildID)
	if err != nil {
		if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownGuild, discordgo.ErrCodeMissingAccess) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	c.guildCache.Set(cacheKey, guild, 0)
	return guild, nil
}

func (c *RestClientWithCache) GuildChannels(ctx context.Context, guildID string) ([]*discordgo.Channel, error) {
	cacheKey := guildChannelsCacheKey(guildID)
	cacheItem := c.guildChannelCache.Get(cacheKey)
	if cacheItem != nil {
		return cacheItem.Value(), nil
	}

	channels, err := c.session.GuildChannels(guildID, discordgo.WithContext(ctx))
	if err != nil {
		if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownGuild, discordgo.ErrCodeMissingAccess) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	for _, channel := range channels {
		c.channelCache.Set(channelCacheKey(channel.ID), channel, 0)
	}

	c.guildChannelCache.Set(cacheKey, channels, 0)
	return channels, nil
}

func (c *RestClientWithCache) Channel(ctx context.Context, channelID string) (*discordgo.Channel, error) {
	cacheKey := channelCacheKey(channelID)
	cacheItem := c.channelCache.Get(cacheKey)
	if cacheItem != nil {
		return cacheItem.Value(), nil
	}

	channel, err := c.session.Channel(channelID, discordgo.WithContext(ctx))
	if err != nil {
		if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownChannel, discordgo.ErrCodeMissingAccess) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	c.channelCache.Set(cacheKey, channel, 0)
	return channel, nil
}

func (c *RestClientWithCache) GuildThreads(ctx context.Context, guildID string) ([]*discordgo.Channel, error) {
	cacheKey := guildThreadsCacheKey(guildID)
	cacheItem := c.guildThreadsCache.Get(cacheKey)
	if cacheItem != nil {
		return cacheItem.Value(), nil
	}

	// TODO: Paginate
	res, err := c.session.GuildThreadsActive(guildID, discordgo.WithContext(ctx))
	if err != nil {
		if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownGuild, discordgo.ErrCodeMissingAccess) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	c.guildThreadsCache.Set(cacheKey, res.Threads, 0)
	return res.Threads, nil
}

func (c *RestClientWithCache) GuildMember(ctx context.Context, guildID string, userID string) (*discordgo.Member, error) {
	cacheKey := memberCacheKey{guildID: guildID, userID: userID}
	cacheItem := c.memberCache.Get(cacheKey)
	if cacheItem != nil {
		return cacheItem.Value(), nil
	}

	member, err := c.session.GuildMember(guildID, userID, discordgo.WithContext(ctx))
	if err != nil {
		if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownMember, discordgo.ErrCodeUnknownGuild, discordgo.ErrCodeMissingAccess) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	c.memberCache.Set(cacheKey, member, 0)
	return member, nil
}

func (c *RestClientWithCache) GuildRoles(ctx context.Context, guildID string) ([]*discordgo.Role, error) {
	cacheKey := guildRolesCacheKey(guildID)
	cacheItem := c.guildRolesCache.Get(cacheKey)
	if cacheItem != nil {
		return cacheItem.Value(), nil
	}

	roles, err := c.session.GuildRoles(guildID, discordgo.WithContext(ctx))
	if err != nil {
		if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownGuild, discordgo.ErrCodeMissingAccess) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	c.guildRolesCache.Set(cacheKey, roles, 0)
	return roles, nil
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
	cacheKey := oauthUserCacheKey(accessToken)
	cacheItem := c.oauthUserCache.Get(cacheKey)
	if cacheItem != nil {
		return cacheItem.Value(), nil
	}

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

	c.oauthUserCache.Set(cacheKey, user, 0)
	return user, nil
}

func (c *RestClientWithCache) OauthUserGuilds(ctx context.Context, accessToken string) ([]*OauthUserGuild, error) {
	cacheKey := oauthUserGuildsCacheKey(accessToken)
	cacheItem := c.oauthUserGuildsCache.Get(cacheKey)
	if cacheItem != nil {
		return cacheItem.Value(), nil
	}

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

	c.oauthUserGuildsCache.Set(cacheKey, guilds, 0)
	return guilds, nil
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

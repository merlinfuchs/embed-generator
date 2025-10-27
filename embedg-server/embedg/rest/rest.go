package rest

import (
	"fmt"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/snowflake/v2"
	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

type RestClient struct {
	rest.Rest

	memberCache *ttlcache.Cache[string, *discord.Member]
}

func NewRestClient(token string, opts ...rest.ConfigOpt) *RestClient {
	memberCache := ttlcache.New(
		ttlcache.WithTTL[string, *discord.Member](5 * time.Minute),
	)
	go memberCache.Start()

	return &RestClient{
		Rest:        rest.New(rest.NewClient(token, opts...)),
		memberCache: memberCache,
	}
}

func (c *RestClient) GetMember(guildID snowflake.ID, userID snowflake.ID, opts ...rest.RequestOpt) (*discord.Member, error) {
	var resErr error

	key := memberCacheKey(guildID, userID)

	loader := func(cache *ttlcache.Cache[string, *discord.Member], key string) *ttlcache.Item[string, *discord.Member] {
		member, err := c.Rest.GetMember(guildID, userID, opts...)
		if err != nil {
			resErr = err
			return nil
		}

		return cache.Set(key, member, 0)
	}

	member := c.memberCache.Get(
		key,
		ttlcache.WithLoader(ttlcache.LoaderFunc[string, *discord.Member](loader)),
	)
	if resErr != nil {
		return nil, resErr
	}

	if member == nil {
		return nil, resErr
	}

	return member.Value(), nil
}

func memberCacheKey(guildID util.ID, userID util.ID) string {
	return fmt.Sprintf("%s:%s", guildID.String(), userID.String())
}

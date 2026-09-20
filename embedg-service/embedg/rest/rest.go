package rest

import (
	"fmt"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/snowflake/v2"
	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"golang.org/x/sync/singleflight"
)

var ProxyURL string

type RestClient struct {
	rest.Rest

	memberCache  *ttlcache.Cache[string, *discord.Member]
	singleFlight singleflight.Group
}

func NewRestClient(token string, opts ...rest.ClientConfigOpt) *RestClient {
	memberCache := ttlcache.New(
		ttlcache.WithTTL[string, *discord.Member](5 * time.Minute),
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

func memberCacheKey(guildID common.ID, userID common.ID) string {
	return fmt.Sprintf("%s:%s", guildID.String(), userID.String())
}

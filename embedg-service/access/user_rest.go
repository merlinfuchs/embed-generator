package access

import (
	"context"
	"net/http"
	"time"

	"github.com/disgoorg/disgo/rest"
	"github.com/jellydator/ttlcache/v3"
	embedgrest "github.com/merlinfuchs/embed-generator/embedg-service/embedg/rest"
)

const (
	// userRestIdleTTL is how long a user's rest client outlives their last request. Every hit
	// extends it, so it only expires once the user has gone quiet.
	userRestIdleTTL      = 10 * time.Minute
	userRestCapacity     = 10_000
	userRestCloseTimeout = 5 * time.Second
)

// userRestClients holds one rest client per session. Discord rate limits bearer token calls per
// token, but disgo keys its buckets on the route alone, so running them through the bot's client
// would queue every user behind a single bucket. A client per session gives each user their own
// limiter; the http client and connection pool are shared. Idle clients are closed on eviction.
type userRestClients struct {
	httpClient *http.Client
	clients    *ttlcache.Cache[string, rest.Rest]
}

func newUserRestClients() *userRestClients {
	clients := ttlcache.New(
		ttlcache.WithTTL[string, rest.Rest](userRestIdleTTL),
		ttlcache.WithCapacity[string, rest.Rest](userRestCapacity),
	)
	clients.OnEviction(func(ctx context.Context, _ ttlcache.EvictionReason, item *ttlcache.Item[string, rest.Rest]) {
		// The limiter has a cleanup goroutine that only stops on Close.
		ctx, cancel := context.WithTimeout(ctx, userRestCloseTimeout)
		defer cancel()
		item.Value().Close(ctx)
	})
	go clients.Start()

	return &userRestClients{
		httpClient: &http.Client{Timeout: 30 * time.Second},
		clients:    clients,
	}
}

// get returns the rest client for a session, creating it on first use. Requests pass the bearer
// token themselves, so the client holds no token of its own.
func (u *userRestClients) get(tokenHash string) rest.Rest {
	item, _ := u.clients.GetOrSetFunc(tokenHash, func() rest.Rest {
		opts := []rest.ClientConfigOpt{rest.WithHTTPClient(u.httpClient)}
		if embedgrest.ProxyURL != "" {
			opts = append(opts, rest.WithURL(embedgrest.ProxyURL))
		}
		return rest.New(rest.NewClient("", opts...))
	})
	return item.Value()
}

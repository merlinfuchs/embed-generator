package user_lookup

import (
	"net/http"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"golang.org/x/sync/singleflight"
	"gopkg.in/guregu/null.v4"
)

const (
	// A profile rarely changes, and a lookup spends the shared bot's rate limit.
	cacheTTL      = 5 * time.Minute
	cacheCapacity = 5_000
)

type UserLookupHandler struct {
	rest         rest.Rest
	cache        *ttlcache.Cache[string, *discord.User]
	singleFlight singleflight.Group
}

func New(restClient rest.Rest) *UserLookupHandler {
	cache := ttlcache.New(
		ttlcache.WithTTL[string, *discord.User](cacheTTL),
		ttlcache.WithCapacity[string, *discord.User](cacheCapacity),
	)
	go cache.Start()

	return &UserLookupHandler{
		rest:  restClient,
		cache: cache,
	}
}

// HandleLookupUser returns the public profile of any Discord user. It doesn't touch a guild or
// channel, so there is no access to check beyond the login that guards the route.
func (h *UserLookupHandler) HandleLookupUser(c *fiber.Ctx) error {
	userID, err := handlers.ParamID(c, "userID")
	if err != nil {
		return err
	}

	user, err := common.GetOrSet(&h.singleFlight, userID.String(), h.cache, func() (*discord.User, error) {
		user, err := h.rest.GetUser(userID)
		if err != nil {
			// An ID nobody has is cached as a nil too, so it doesn't cost a request every time.
			if common.IsDiscordRestStatusCode(err, http.StatusNotFound) {
				return nil, nil
			}
			return nil, err
		}
		return user, nil
	})
	if err != nil {
		return err
	}
	if user == nil {
		return handlers.NotFound("unknown_user", "No Discord user has that ID.")
	}

	accentColor := null.Int{}
	if user.AccentColor != nil {
		accentColor = null.IntFrom(int64(*user.AccentColor))
	}

	return c.JSON(wire.UserLookupResponseWire{
		Success: true,
		Data: wire.UserLookupWire{
			ID:            user.ID,
			Username:      user.Username,
			Discriminator: user.Discriminator,
			GlobalName:    null.StringFromPtr(user.GlobalName),
			Avatar:        null.StringFromPtr(user.Avatar),
			Banner:        null.StringFromPtr(user.Banner),
			AccentColor:   accentColor,
			Bot:           user.Bot,
			System:        user.System,
			PublicFlags:   int(user.PublicFlags),
		},
	})
}

package access

import (
	"context"
	"fmt"
	"net/http"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

// GetMemberForUser fetches the session user's own member in guildID with their OAuth token, so
// the bot needs no member cache. Discord limits these calls per user, but disgo's rate limiter
// keys buckets on the route alone, so on this instance all users still queue behind one bucket.
// Returns store.ErrNotFound if the user is not in the guild.
func (m *AccessManager) GetMemberForUser(ctx context.Context, sess *session.Session, guildID common.ID) (*discord.Member, error) {
	key := fmt.Sprintf("%s:%s", sess.TokenHash, guildID)

	return common.GetOrSet(&m.singleFlight, key, m.userMemberCache, func() (*discord.Member, error) {
		token, err := m.sessionManager.UserToken(ctx, sess)
		if err != nil {
			return nil, fmt.Errorf("failed to get user token: %w", err)
		}

		member, err := m.rest.GetCurrentMember(token, guildID)
		if err != nil {
			if common.IsDiscordRestStatusCode(err, http.StatusNotFound, http.StatusForbidden) {
				return nil, store.ErrNotFound
			}
			if common.IsDiscordRestStatusCode(err, http.StatusUnauthorized) {
				// The token was revoked between the refresh and now, or Discord dropped it.
				return nil, m.sessionManager.InvalidateSession(ctx, sess)
			}
			return nil, fmt.Errorf("failed to get member for user: %w", err)
		}

		member.GuildID = guildID
		return member, nil
	})
}

// GetGuildsForUser lists the guilds the session user is in, with the guild level permissions Discord
// computed for them. Replaces session.GuildIDs, which is captured at login and never refreshed.
// Discord caps a user at 200 guilds, so one page is always enough.
func (m *AccessManager) GetGuildsForUser(ctx context.Context, sess *session.Session) ([]discord.OAuth2Guild, error) {
	return common.GetOrSet(&m.singleFlight, "guilds:"+sess.TokenHash, m.userGuildsCache, func() ([]discord.OAuth2Guild, error) {
		token, err := m.sessionManager.UserToken(ctx, sess)
		if err != nil {
			return nil, fmt.Errorf("failed to get user token: %w", err)
		}

		guilds, err := m.rest.GetCurrentUserGuilds(token, 0, 0, 200, false)
		if err != nil {
			if common.IsDiscordRestStatusCode(err, http.StatusUnauthorized) {
				return nil, m.sessionManager.InvalidateSession(ctx, sess)
			}
			return nil, fmt.Errorf("failed to get guilds for user: %w", err)
		}
		return guilds, nil
	})
}

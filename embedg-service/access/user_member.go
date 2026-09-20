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

// GetMemberForUser fetches the session user's own member in guildID with their OAuth token,
// which keeps these requests on a per-user rate limit bucket instead of the bot's.
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
			return nil, fmt.Errorf("failed to get guilds for user: %w", err)
		}
		return guilds, nil
	})
}

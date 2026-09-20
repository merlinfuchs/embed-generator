package access

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"golang.org/x/sync/singleflight"
)

const RequiredPermissions = discord.PermissionManageWebhooks

type AccessManager struct {
	guildState     *guildstate.Provider
	guildStore     store.GuildStore
	rest           rest.Rest
	appContext     store.AppContext
	sessionManager *session.SessionManager

	singleFlight    singleflight.Group
	userMemberCache *ttlcache.Cache[string, *discord.Member]
	userGuildsCache *ttlcache.Cache[string, []discord.OAuth2Guild]
	userRest        rest.Rest
}

func New(
	guildState *guildstate.Provider,
	guildStore store.GuildStore,
	rest rest.Rest,
	appContext store.AppContext,
	sessionManager *session.SessionManager,
) *AccessManager {
	userMemberCache := ttlcache.New(ttlcache.WithTTL[string, *discord.Member](time.Minute))
	go userMemberCache.Start()

	userGuildsCache := ttlcache.New(ttlcache.WithTTL[string, []discord.OAuth2Guild](time.Minute))
	go userGuildsCache.Start()

	return &AccessManager{
		guildState:      guildState,
		guildStore:      guildStore,
		rest:            rest,
		appContext:      appContext,
		sessionManager:  sessionManager,
		userMemberCache: userMemberCache,
		userGuildsCache: userGuildsCache,
		userRest:        newUserRest(),
	}
}

type GuildAccess struct {
	CombinedUserPermissions discord.Permissions
	CombinedBotPermissions  discord.Permissions
}

func (g *GuildAccess) HasChannelWithUserAccess() bool {
	return g.CombinedUserPermissions&(RequiredPermissions|discord.PermissionAdministrator) != 0
}

func (g *GuildAccess) HasChannelWithBotAccess() bool {
	return g.CombinedBotPermissions&(RequiredPermissions|discord.PermissionAdministrator) != 0
}

type ChannelAccess struct {
	UserPermissions discord.Permissions
	BotPermissions  discord.Permissions
}

func (c *ChannelAccess) UserAccess() bool {
	return c.UserPermissions&(RequiredPermissions|discord.PermissionAdministrator) != 0
}

func (c *ChannelAccess) BotAccess() bool {
	return c.BotPermissions&(RequiredPermissions|discord.PermissionAdministrator) != 0
}

// GetGuildAccessForSession resolves the user's member with their own OAuth token.
func (m *AccessManager) GetGuildAccessForSession(ctx context.Context, sess *session.Session, guildID common.ID) (GuildAccess, *discord.Guild, error) {
	res := GuildAccess{}

	botMember, err := m.GetGuildMember(ctx, guildID, m.appContext.ApplicationID())
	if err != nil {
		if common.IsDiscordRestErrorCode(
			err,
			rest.JSONErrorCodeMissingAccess,
			rest.JSONErrorCodeUnknownGuild,
			rest.JSONErrorCodeUnknownMember,
		) {
			// The bot is not in the server, so we can't compute the permissions
			return res, nil, nil
		}
		return res, nil, fmt.Errorf("Failed to get bot member: %w", err)
	}

	state, err := m.guildState.Guild(ctx, guildID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return res, nil, nil
		}
		return res, nil, fmt.Errorf("Failed to get guild state: %w", err)
	}

	res.CombinedBotPermissions = maxChannelPermissions(state, m.appContext.ApplicationID(), botMember.RoleIDs, RequiredPermissions)
	if !res.HasChannelWithBotAccess() {
		// No point in checking user access if the bot doesn't have access to any channels
		return res, &state.Guild, nil
	}

	member, err := m.GetMemberForUser(ctx, sess, guildID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			// The user is not in the server, so we can't compute the permissions
			return res, nil, nil
		}
		return res, nil, fmt.Errorf("Failed to get guild member: %w", err)
	}

	res.CombinedUserPermissions = maxChannelPermissions(state, sess.UserID, member.RoleIDs, RequiredPermissions)
	return res, &state.Guild, nil
}

// GuildChannelAccess pairs a channel with what the user and the bot may do in it.
type GuildChannelAccess struct {
	Channel discord.GuildChannel
	Access  ChannelAccess
}

// ChannelAccessForGuild computes access for every channel and active thread in one pass. Resolving
// each channel on its own would be a REST call per channel; this is one guild state fetch and two
// member fetches for the whole list.
func (m *AccessManager) ChannelAccessForGuild(ctx context.Context, sess *session.Session, guildID common.ID) ([]GuildChannelAccess, error) {
	state, err := m.guildState.Guild(ctx, guildID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}

	botMember, err := m.GetGuildMember(ctx, guildID, m.appContext.ApplicationID())
	if err != nil {
		return nil, fmt.Errorf("Failed to get bot member: %w", err)
	}

	userMember, err := m.GetMemberForUser(ctx, sess, guildID)
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		return nil, fmt.Errorf("Failed to get guild member: %w", err)
	}

	threads, err := m.guildState.Threads(ctx, guildID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get threads: %w", err)
	}

	res := make([]GuildChannelAccess, 0, len(state.Channels)+len(threads))

	for _, channel := range state.Channels {
		res = append(res, GuildChannelAccess{
			Channel: channel,
			Access:  m.channelAccess(state, channel, userMember, botMember),
		})
	}

	for _, thread := range threads {
		res = append(res, GuildChannelAccess{
			Channel: thread,
			Access:  m.channelAccess(state, thread, userMember, botMember),
		})
	}

	return res, nil
}

func (m *AccessManager) channelAccess(state *guildstate.State, channel discord.GuildChannel, userMember *discord.Member, botMember *discord.Member) ChannelAccess {
	source := permissionSource(channel, state)

	res := ChannelAccess{
		BotPermissions: memberPermissions(&state.Guild, state.Roles, source, botMember.User.ID, botMember.RoleIDs),
	}
	if userMember != nil {
		res.UserPermissions = memberPermissions(&state.Guild, state.Roles, source, userMember.User.ID, userMember.RoleIDs)
	}
	return res
}

// GetChannelAccessForSession resolves the user's member with their own OAuth token.
func (m *AccessManager) GetChannelAccessForSession(ctx context.Context, sess *session.Session, channelID common.ID) (ChannelAccess, error) {
	res := ChannelAccess{}

	userPermissions, err := m.computePermissionsForChannel(ctx, channelID, func(guildID common.ID) (*discord.Member, error) {
		return m.GetMemberForUser(ctx, sess, guildID)
	})
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		return res, err
	}
	res.UserPermissions = userPermissions

	res.BotPermissions, err = m.ComputeBotPermissionsForChannel(ctx, channelID)
	if err != nil {
		return res, err
	}

	return res, nil
}

// computePermissionsForChannel resolves the channel's guild and lets the caller decide how the
// member is fetched, so the bot token and user token paths share everything else.
func (m *AccessManager) computePermissionsForChannel(ctx context.Context, channelID common.ID, getMember func(guildID common.ID) (*discord.Member, error)) (discord.Permissions, error) {
	channel, err := m.guildState.Channel(ctx, channelID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return 0, nil
		}
		return 0, err
	}
	if channel.GuildID() == 0 {
		return 0, nil
	}

	member, err := getMember(channel.GuildID())
	if err != nil {
		return 0, err
	}

	return m.memberPermissionsInChannel(ctx, *member, channel)
}

// ComputeMemberPermissionsForChannel computes an already resolved member's permissions in a channel,
// for callers that fetched the member themselves.
func (m *AccessManager) ComputeMemberPermissionsForChannel(ctx context.Context, member discord.Member, channelID common.ID) (discord.Permissions, error) {
	return m.computePermissionsForChannel(ctx, channelID, func(common.ID) (*discord.Member, error) {
		return &member, nil
	})
}

func (m *AccessManager) memberPermissionsInChannel(ctx context.Context, member discord.Member, channel discord.GuildChannel) (discord.Permissions, error) {
	state, err := m.guildState.Guild(ctx, channel.GuildID())
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return 0, nil
		}
		return 0, err
	}

	return memberPermissions(&state.Guild, state.Roles, permissionSource(channel, state), member.User.ID, member.RoleIDs), nil
}

func (m *AccessManager) ComputeBotPermissionsForChannel(ctx context.Context, channelID common.ID) (discord.Permissions, error) {
	return m.computePermissionsForChannel(ctx, channelID, func(guildID common.ID) (*discord.Member, error) {
		return m.GetGuildMember(ctx, guildID, m.appContext.ApplicationID())
	})
}

// GetGuildMember fetches with the bot token, for the bot's own member and for callers without a
// session. The rest client caches members for five minutes behind singleflight.
func (m *AccessManager) GetGuildMember(ctx context.Context, guildID common.ID, userID common.ID) (*discord.Member, error) {
	member, err := m.rest.GetMember(guildID, userID, rest.WithCtx(ctx))
	if err != nil {
		return nil, fmt.Errorf("Failed to get guild member: %w", err)
	}

	return member, nil
}

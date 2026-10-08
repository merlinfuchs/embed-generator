package access

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"golang.org/x/sync/singleflight"
)

const RequiredPermissions = discord.PermissionManageWebhooks

// requiredPermissionsName is RequiredPermissions as users know it. View Channel is part of it
// because Discord voids every other permission in a channel the member can't see.
const requiredPermissionsName = "the View Channel and Manage Webhooks permissions"

// HasRequiredPermissions reports whether permissions allow sending, administrators included.
func HasRequiredPermissions(permissions discord.Permissions) bool {
	return permissions&(RequiredPermissions|discord.PermissionAdministrator) != 0
}

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
	// Without disabling touch on hit every read extends the entry, so a user retrying after a role
	// change would keep their stale member for as long as they keep retrying.
	userMemberCache := ttlcache.New(
		ttlcache.WithTTL[string, *discord.Member](time.Minute),
		ttlcache.WithDisableTouchOnHit[string, *discord.Member](),
	)
	go userMemberCache.Start()

	userGuildsCache := ttlcache.New(
		ttlcache.WithTTL[string, []discord.OAuth2Guild](time.Minute),
		ttlcache.WithDisableTouchOnHit[string, []discord.OAuth2Guild](),
	)
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
	// BotInGuild and UserInGuild tell "not in the server" apart from "in it without permissions".
	// The user is only looked up once the bot has access.
	BotInGuild   bool
	UserInGuild  bool
	UserTimedOut bool

	CombinedUserPermissions discord.Permissions
	CombinedBotPermissions  discord.Permissions
}

func (g *GuildAccess) HasChannelWithUserAccess() bool {
	return HasRequiredPermissions(g.CombinedUserPermissions)
}

func (g *GuildAccess) HasChannelWithBotAccess() bool {
	return HasRequiredPermissions(g.CombinedBotPermissions)
}

type ChannelAccess struct {
	// Only GetChannelAccessForSession fills these in. The bot can't load a channel that was deleted
	// or that it can't see, and Discord doesn't say which.
	ChannelFound bool
	UserInGuild  bool
	UserTimedOut bool

	UserPermissions discord.Permissions
	BotPermissions  discord.Permissions
}

func (c *ChannelAccess) UserAccess() bool {
	return HasRequiredPermissions(c.UserPermissions)
}

func (c *ChannelAccess) BotAccess() bool {
	return HasRequiredPermissions(c.BotPermissions)
}

// BotCanSend reports whether the bot can post its own messages in the channel, as actions that send
// to another channel do. A thread's permissions are its parent's, where posting in threads is its
// own permission.
func (c *ChannelAccess) BotCanSend(channel discord.GuildChannel) bool {
	if _, ok := channel.(discord.GuildThread); ok {
		return c.BotPermissions.Has(discord.PermissionSendMessagesInThreads)
	}
	return c.BotPermissions.Has(discord.PermissionSendMessages)
}

// GetGuildAccessForSession resolves the user's member with their own OAuth token.
func (m *AccessManager) GetGuildAccessForSession(ctx context.Context, sess *session.Session, guildID common.ID) (GuildAccess, error) {
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
			return res, nil
		}
		return res, fmt.Errorf("Failed to get bot member: %w", err)
	}

	state, err := m.guildState.Guild(ctx, guildID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return res, nil
		}
		return res, fmt.Errorf("Failed to get guild state: %w", err)
	}

	res.BotInGuild = true
	res.CombinedBotPermissions = maxChannelPermissions(state, *botMember, RequiredPermissions)
	if !res.HasChannelWithBotAccess() {
		// No point in checking user access if the bot doesn't have access to any channels
		return res, nil
	}

	member, err := m.GetMemberForUser(ctx, sess, guildID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			// The user is not in the server, so we can't compute the permissions
			return res, nil
		}
		return res, fmt.Errorf("Failed to get guild member: %w", err)
	}

	res.UserInGuild = true
	res.UserTimedOut = isTimedOut(*member)
	res.CombinedUserPermissions = maxChannelPermissions(state, *member, RequiredPermissions)
	return res, nil
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

	byID := channelsByID(state.Channels)
	for _, thread := range threads {
		source, ok := permissionSource(thread, byID)
		if !ok {
			continue
		}
		res = append(res, GuildChannelAccess{
			Channel: thread,
			Access:  m.channelAccess(state, source, userMember, botMember),
		})
	}

	return res, nil
}

func (m *AccessManager) channelAccess(state *guildstate.State, source discord.GuildChannel, userMember *discord.Member, botMember *discord.Member) ChannelAccess {
	res := ChannelAccess{
		BotPermissions: memberPermissions(&state.Guild, state.Roles, source, *botMember),
	}
	if userMember != nil {
		res.UserPermissions = memberPermissions(&state.Guild, state.Roles, source, *userMember)
	}
	return res
}

// GetChannelAccessForSession resolves the user's member with their own OAuth token.
func (m *AccessManager) GetChannelAccessForSession(ctx context.Context, sess *session.Session, channelID common.ID) (ChannelAccess, error) {
	res := ChannelAccess{}

	channel, err := m.guildState.Channel(ctx, channelID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return res, nil
		}
		return res, err
	}
	if channel.GuildID() == 0 {
		return res, nil
	}
	res.ChannelFound = true

	member, err := m.GetMemberForUser(ctx, sess, channel.GuildID())
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		return res, err
	}
	if member != nil {
		res.UserInGuild = true
		res.UserTimedOut = isTimedOut(*member)
		res.UserPermissions, err = m.memberPermissionsInChannel(ctx, *member, channel)
		if err != nil {
			return res, err
		}
	}

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

	// The channel was just fetched with the bot token, so the bot can see it and a thread's parent.
	// Fetching the parent rather than looking it up in the guild's channel list keeps a list that
	// predates the parent from denying access.
	source := channel
	if thread, ok := channel.(discord.GuildThread); ok && thread.ParentID() != nil {
		parent, err := m.guildState.Channel(ctx, *thread.ParentID())
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return 0, nil
			}
			return 0, err
		}
		source = parent
	}

	return memberPermissions(&state.Guild, state.Roles, source, member), nil
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

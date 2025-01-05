package access

import (
	"sync"
	"time"

	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/spf13/viper"
)

type AccessManager struct {
	state       *discordgo.State
	session     *discordgo.Session
	memberCache *ttlcache.Cache[string, *discordgo.Member]
	memberLocks sync.Map
}

func New(state *discordgo.State, session *discordgo.Session) *AccessManager {
	memberCache := ttlcache.New(
		ttlcache.WithTTL[string, *discordgo.Member](3*time.Minute),
		ttlcache.WithDisableTouchOnHit[string, *discordgo.Member](),
	)
	go memberCache.Start()

	return &AccessManager{
		state:       state,
		session:     session,
		memberCache: memberCache,
		memberLocks: sync.Map{},
	}
}

type GuildAccess struct {
	HasChannelWithUserAccess bool
	HasChannelWithBotAccess  bool
}

type ChannelAccess struct {
	UserPermissions int64
	BotPermissions  int64
}

func (c *ChannelAccess) UserAccess() bool {
	return c.UserPermissions&(discordgo.PermissionManageWebhooks|discordgo.PermissionAdministrator) != 0
}

func (c *ChannelAccess) BotAccess() bool {
	return c.BotPermissions&(discordgo.PermissionManageWebhooks|discordgo.PermissionAdministrator) != 0
}

func (m *AccessManager) GetGuildAccessForUser(userID string, guildID string) (GuildAccess, error) {
	res := GuildAccess{}

	guild, err := m.state.Guild(guildID)
	if err != nil {
		if err == discordgo.ErrStateNotFound {
			return res, nil
		}
		return res, err
	}

	if guild.OwnerID == userID {
		res.HasChannelWithUserAccess = true
	}

	for _, channel := range guild.Channels {
		if !res.HasChannelWithUserAccess {
			access := ChannelAccess{}
			err := m.SetChannelAccessUserPermissions(&access, userID, channel.ID)
			if err != nil {
				return res, err
			}

			if access.UserAccess() {
				res.HasChannelWithUserAccess = true
			}
		}

		if !res.HasChannelWithBotAccess {
			access := ChannelAccess{}
			err = m.SetChannelAccessBotPermissions(&access, channel.ID)
			if err != nil {
				return res, err
			}

			if access.BotAccess() {
				res.HasChannelWithBotAccess = true
			}
		}

		// We can stop iterating if we already know that the user has access to both
		if res.HasChannelWithBotAccess && res.HasChannelWithUserAccess {
			break
		}
	}

	return res, nil
}

func (m *AccessManager) GetChannelAccessForUser(userID string, channelID string) (ChannelAccess, error) {
	res := ChannelAccess{}

	err := m.SetChannelAccessUserPermissions(&res, userID, channelID)
	if err != nil {
		return res, err
	}

	err = m.SetChannelAccessBotPermissions(&res, channelID)
	if err != nil {
		return res, err
	}

	return res, nil
}

func (m *AccessManager) SetChannelAccessUserPermissions(res *ChannelAccess, userID string, channelID string) (err error) {
	res.UserPermissions, err = m.ComputeUserPermissionsForChannel(userID, channelID)
	if err != nil {
		if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownMember) {
			// The user is not in the server, so we can't compute the permissions
			return nil
		}
		return err
	}

	return nil
}

func (m *AccessManager) SetChannelAccessBotPermissions(res *ChannelAccess, channelID string) error {
	botPerms, err := m.ComputeBotPermissionsForChannel(channelID)
	if err != nil {
		return err
	}
	if botPerms == 0 {
		// The bot doesn't have access to the server so there is no point in checking access for the user
		return nil
	}
	res.BotPermissions = botPerms

	return nil
}

func (m *AccessManager) ComputeUserPermissionsForChannel(userID string, channelID string) (int64, error) {
	// We need to make sure the member is in the state, otherwise the permissions will be wrong
	channel, err := m.state.Channel(channelID)
	if err != nil {
		if err == discordgo.ErrStateNotFound {
			return 0, nil
		}
		return 0, err
	}

	guild, err := m.state.Guild(channel.GuildID)
	if err != nil {
		if err == discordgo.ErrStateNotFound {
			return 0, nil
		}
		return 0, err
	}

	if guild.OwnerID == userID {
		// Owner has access to all channels
		return discordgo.PermissionAll, nil
	}

	member, err := m.GetGuildMember(guild.ID, userID)
	if err != nil {
		return 0, err
	}

	// this is workaround to compute the permissions using discordgo, we remove it afterwards
	m.state.MemberAdd(member)
	defer m.state.MemberRemove(member)

	perms, err := m.state.UserChannelPermissions(userID, channelID)
	if err == discordgo.ErrStateNotFound {
		return 0, nil
	}

	return perms, err
}

func (m *AccessManager) ComputeBotPermissionsForChannel(channelID string) (int64, error) {
	perms, err := m.state.UserChannelPermissions(viper.GetString("discord.client_id"), channelID)
	if err == discordgo.ErrStateNotFound {
		return 0, nil
	}
	return perms, err
}

func (m *AccessManager) GetGuildMember(guildID string, userID string) (*discordgo.Member, error) {
	cacheKey := guildID + userID
	cacheItem := m.memberCache.Get(cacheKey)
	if cacheItem != nil {
		return cacheItem.Value(), nil
	}

	// We don't want multiple goroutines to fetch the same member at the same time
	lockKey := memberLockKey{guildID: guildID, userID: userID}
	lock, _ := m.memberLocks.LoadOrStore(lockKey, &sync.Mutex{})

	lock.(*sync.Mutex).Lock()
	defer lock.(*sync.Mutex).Unlock()
	defer m.memberLocks.Delete(lockKey)

	// We need to check the cache again in case another goroutine already fetched the member
	cacheItem = m.memberCache.Get(cacheKey)
	if cacheItem != nil {
		return cacheItem.Value(), nil
	}

	member, err := m.session.GuildMember(guildID, userID)
	if err != nil {
		return nil, err
	}

	m.memberCache.Set(cacheKey, member, time.Minute*3)
	return member, nil
}

type memberLockKey struct {
	guildID string
	userID  string
}

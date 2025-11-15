package access

import (
	"fmt"

	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

type AccessManager struct {
	caches     cache.Caches
	rest       rest.Rest
	appContext store.AppContext
}

func New(caches cache.Caches, rest rest.Rest, appContext store.AppContext) *AccessManager {
	return &AccessManager{
		caches:     caches,
		rest:       rest,
		appContext: appContext,
	}
}

type GuildAccess struct {
	HasChannelWithUserAccess bool
	HasChannelWithBotAccess  bool
}

type ChannelAccess struct {
	UserPermissions discord.Permissions
	BotPermissions  discord.Permissions
}

func (c *ChannelAccess) UserAccess() bool {
	return c.UserPermissions&(discord.PermissionManageWebhooks|discord.PermissionAdministrator) != 0
}

func (c *ChannelAccess) BotAccess() bool {
	return c.BotPermissions&(discord.PermissionManageWebhooks|discord.PermissionAdministrator) != 0
}

func (m *AccessManager) GetGuildAccessForUser(userID common.ID, guildID common.ID) (GuildAccess, error) {
	res := GuildAccess{}

	guild, ok := m.caches.Guild(guildID)
	if !ok {
		return res, nil
	}

	if guild.OwnerID == userID {
		res.HasChannelWithUserAccess = true
	}

	channels := m.caches.ChannelsForGuild(guildID)

	for channel := range channels {
		if !res.HasChannelWithUserAccess {
			access := ChannelAccess{}
			err := m.SetChannelAccessUserPermissions(&access, userID, channel.ID())
			if err != nil {
				return res, err
			}

			if access.UserAccess() {
				res.HasChannelWithUserAccess = true
			}
		}

		if !res.HasChannelWithBotAccess {
			access := ChannelAccess{}
			err := m.SetChannelAccessBotPermissions(&access, channel.ID())
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

func (m *AccessManager) GetChannelAccessForUser(userID common.ID, channelID common.ID) (ChannelAccess, error) {
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

func (m *AccessManager) SetChannelAccessUserPermissions(res *ChannelAccess, userID common.ID, channelID common.ID) (err error) {
	res.UserPermissions, err = m.ComputeUserPermissionsForChannel(userID, channelID)
	if err != nil {
		if common.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownMember) {
			// The user is not in the server, so we can't compute the permissions
			return nil
		}
		return err
	}

	return nil
}

func (m *AccessManager) SetChannelAccessBotPermissions(res *ChannelAccess, channelID common.ID) error {
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

func (m *AccessManager) ComputeUserPermissionsForChannel(userID common.ID, channelID common.ID) (discord.Permissions, error) {
	channel, ok := m.caches.Channel(channelID)
	if !ok {
		return 0, nil
	}

	guild, ok := m.caches.Guild(channel.GuildID())
	if !ok {
		return 0, nil
	}

	roleIterator := m.caches.Roles(channel.GuildID())
	roles := make([]discord.Role, 0)
	for role := range roleIterator {
		roles = append(roles, role)
	}

	if guild.OwnerID == userID {
		// Owner has access to all channels
		return discord.PermissionsAll, nil
	}

	member, err := m.GetGuildMember(guild.ID, userID)
	if err != nil {
		return 0, err
	}

	perms := memberPermissions(&guild, roles, channel, userID, member.RoleIDs)
	return perms, err
}

func (m *AccessManager) ComputeBotPermissionsForChannel(channelID common.ID) (discord.Permissions, error) {
	return m.ComputeUserPermissionsForChannel(m.appContext.ApplicationID(), channelID)
}

func (m *AccessManager) GetGuildMember(guildID common.ID, userID common.ID) (*discord.Member, error) {
	cached, ok := m.caches.Member(guildID, userID)
	if ok {
		return &cached, nil
	}

	member, err := m.rest.GetMember(guildID, userID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get guild member: %w", err)
	}

	return member, nil
}

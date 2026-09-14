package access

import (
	"context"
	"fmt"

	discache "github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/merlinfuchs/stateway/stateway-lib/cache"
)

const RequiredPermissions = discord.PermissionManageWebhooks

type AccessManager struct {
	cache      cache.Cache
	caches     discache.Caches
	rest       rest.Rest
	appContext store.AppContext
}

func New(cache cache.Cache, caches discache.Caches, rest rest.Rest, appContext store.AppContext) *AccessManager {
	return &AccessManager{
		cache:      cache,
		caches:     caches,
		rest:       rest,
		appContext: appContext,
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

func (m *AccessManager) CheckGuildsKnown(guildID []common.ID) ([]bool, error) {
	known, err := m.cache.CheckGuildsExist(context.Background(), guildID)
	if err != nil {
		return nil, fmt.Errorf("Failed to check guilds known: %w", err)
	}

	return known, nil
}

func (m *AccessManager) GetGuildAccessForUser(userID common.ID, guildID common.ID) (GuildAccess, *discord.Guild, error) {
	res := GuildAccess{}

	botMember, err := m.GetGuildMember(guildID, m.appContext.ApplicationID())
	if err != nil {
		if common.IsDiscordRestErrorCode(
			err,
			discordgo.ErrCodeMissingAccess,
			discordgo.ErrCodeUnknownGuild,
			discordgo.ErrCodeUnknownMember,
		) {
			// The bot is not in the server, so we can't compute the permissions
			return res, nil, nil
		}
		return res, nil, fmt.Errorf("Failed to get bot member: %w", err)
	}

	guild, err := m.cache.GetGuildWithPermissions(
		context.Background(),
		guildID,
		m.appContext.ApplicationID(),
		botMember.RoleIDs,
		RequiredPermissions,
		nil...,
	)
	if err != nil {
		return res, nil, fmt.Errorf("Failed to get guild with permissions: %w", err)
	}

	res.CombinedBotPermissions = guild.MaxChannelPermissions
	if !res.HasChannelWithBotAccess() {
		// No point in checking user access if the bot doesn't have access to any channels
		return res, &guild.Guild.Data, nil
	}

	member, err := m.GetGuildMember(guildID, userID)
	if err != nil {
		if common.IsDiscordRestErrorCode(
			err,
			discordgo.ErrCodeMissingAccess,
			discordgo.ErrCodeUnknownGuild,
			discordgo.ErrCodeUnknownMember,
		) {
			// The user is not in the server, so we can't compute the permissions
			return res, nil, nil
		}
		return res, nil, fmt.Errorf("Failed to get guild member: %w", err)
	}

	guild, err = m.cache.GetGuildWithPermissions(
		context.Background(),
		guildID,
		userID,
		member.RoleIDs,
		RequiredPermissions,
		nil...,
	)
	if err != nil {
		return res, nil, fmt.Errorf("Failed to get guild with permissions: %w", err)
	}

	res.CombinedUserPermissions = guild.MaxChannelPermissions
	return res, &guild.Guild.Data, nil
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
	if !ok || channel.GuildID() == 0 {
		return 0, nil
	}

	member, err := m.GetGuildMember(channel.GuildID(), userID)
	if err != nil {
		// TODO: Handle this error
		return 0, nil
	}

	return m.caches.MemberPermissionsInChannel(channel, *member), nil
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

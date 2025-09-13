package access

import (
	"context"
	"errors"
	"fmt"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/rest"
	"github.com/spf13/viper"
)

type AccessManager struct {
	rest rest.RestClient
}

func New(rest rest.RestClient) *AccessManager {
	return &AccessManager{
		rest: rest,
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

func (m *AccessManager) GetChannelAccess(ctx context.Context, userID string, channelID string) (ChannelAccess, error) {
	res := ChannelAccess{}

	userPerms, err := m.UserChannelPermissions(ctx, userID, channelID)
	if err != nil {
		return res, err
	}
	res.UserPermissions = userPerms

	botPerms, err := m.UserChannelPermissions(ctx, viper.GetString("discord.client_id"), channelID)
	if err != nil {
		return res, err
	}
	res.BotPermissions = botPerms

	return res, nil
}

type memberLockKey struct {
	guildID string
	userID  string
}

func (m *AccessManager) OauthUserInGuild(ctx context.Context, accessToken string, guildID string) (bool, error) {
	_, err := m.rest.OauthUserGuild(ctx, accessToken, guildID)
	if err != nil {
		if err == rest.ErrNotFound {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (m *AccessManager) OauthUserGuildPermissions(ctx context.Context, accessToken string, guildID string) (int64, error) {
	guild, err := m.rest.OauthUserGuild(ctx, accessToken, guildID)
	if err != nil {
		return 0, err
	}
	if guild.Owner {
		return discordgo.PermissionAll, nil
	}
	return guild.Permissions, nil
}

func (m *AccessManager) UserGuildPermissions(ctx context.Context, userID string, guildID string) (int64, error) {
	guild, err := m.rest.Guild(ctx, guildID)
	if err != nil {
		return 0, err
	}
	if guild.OwnerID == userID {
		return discordgo.PermissionAll, nil
	}

	member, err := m.rest.GuildMember(context.Background(), guild.ID, userID)
	if err != nil {
		return 0, err
	}

	memberRoles := make(map[string]bool, len(member.Roles))
	for _, roleID := range member.Roles {
		memberRoles[roleID] = true
	}

	var permissions int64
	for _, role := range guild.Roles {
		if memberRoles[role.ID] || role.ID == guild.ID {
			permissions |= role.Permissions
		}
	}

	if permissions&(discordgo.PermissionAdministrator) != 0 {
		return discordgo.PermissionAll, nil
	}

	return permissions, nil
}

func (m *AccessManager) UserChannelPermissions(ctx context.Context, userID string, channelID string) (int64, error) {
	channel, err := m.rest.Channel(ctx, channelID)
	if err != nil {
		if errors.Is(err, rest.ErrNotFound) {
			return 0, fmt.Errorf("channel not found: %w", err)
		}
		return 0, err
	}

	if channel.GuildID == "" {
		return 0, fmt.Errorf("channel is not in a guild: %w", err)
	}

	guild, err := m.rest.Guild(ctx, channel.GuildID)
	if err != nil {
		if errors.Is(err, rest.ErrNotFound) {
			return 0, fmt.Errorf("guild not found: %w", err)
		}
		return 0, err
	}
	if guild.OwnerID == userID {
		return discordgo.PermissionAll, nil
	}

	member, err := m.rest.GuildMember(ctx, guild.ID, userID)
	if err != nil {
		if errors.Is(err, rest.ErrNotFound) {
			return 0, fmt.Errorf("member not found: %w", err)
		}
		return 0, err
	}

	memberRoles := make(map[string]bool, len(member.Roles))
	for _, roleID := range member.Roles {
		memberRoles[roleID] = true
	}

	var permissions int64
	for _, role := range guild.Roles {
		if memberRoles[role.ID] || role.ID == guild.ID {
			permissions |= role.Permissions
		}
	}

	if permissions&(discordgo.PermissionAdministrator) != 0 {
		return discordgo.PermissionAll, nil
	}

	var everyoneAllow int64
	var everyoneDeny int64
	var allow int64
	var deny int64

	for _, overwrite := range channel.PermissionOverwrites {
		if overwrite.ID == guild.ID {
			everyoneAllow |= overwrite.Allow
			everyoneDeny |= overwrite.Deny
		}

		if overwrite.ID == userID || memberRoles[overwrite.ID] {
			allow |= overwrite.Allow
			deny |= overwrite.Deny
		}
	}

	permissions &= ^everyoneDeny
	permissions |= everyoneAllow
	permissions &= ^deny
	permissions |= allow

	return permissions, err
}

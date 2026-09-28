package access

import (
	"errors"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
)

// deniedMessage is the message a Denied error shows, empty for no error.
func deniedMessage(t *testing.T, err error) string {
	t.Helper()
	if err == nil {
		return ""
	}
	var e *wire.Error
	if !errors.As(err, &e) {
		t.Fatalf("Denied() = %v, want a *wire.Error", err)
	}
	return e.Message
}

func TestGuildAccessDenied(t *testing.T) {
	const send = discord.PermissionManageWebhooks

	tests := []struct {
		name   string
		access GuildAccess
		want   string
	}{
		{"bot not in server", GuildAccess{}, "The bot isn't in this server."},
		{
			"bot without permissions",
			GuildAccess{BotInGuild: true},
			"The bot needs the View Channel and Manage Webhooks permissions in at least one channel of this server.",
		},
		{
			"user not in server",
			GuildAccess{BotInGuild: true, CombinedBotPermissions: send},
			"You aren't a member of this server.",
		},
		{
			"user timed out",
			GuildAccess{BotInGuild: true, UserInGuild: true, UserTimedOut: true, CombinedBotPermissions: send},
			"You're timed out in this server.",
		},
		{
			"user without permissions",
			GuildAccess{BotInGuild: true, UserInGuild: true, CombinedBotPermissions: send},
			"You need the View Channel and Manage Webhooks permissions in at least one channel of this server.",
		},
		{
			"both can send",
			GuildAccess{BotInGuild: true, UserInGuild: true, CombinedBotPermissions: send, CombinedUserPermissions: send},
			"",
		},
		{
			"administrators can send",
			GuildAccess{BotInGuild: true, UserInGuild: true, CombinedBotPermissions: send, CombinedUserPermissions: discord.PermissionAdministrator},
			"",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := deniedMessage(t, tt.access.Denied()); got != tt.want {
				t.Errorf("Denied() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestChannelAccessDenied(t *testing.T) {
	const send = discord.PermissionManageWebhooks

	tests := []struct {
		name   string
		access ChannelAccess
		want   string
	}{
		{"channel not found", ChannelAccess{}, "The channel doesn't exist, or the bot can't see it."},
		{
			"bot without permissions",
			ChannelAccess{ChannelFound: true, UserInGuild: true, UserPermissions: send},
			"The bot needs the View Channel and Manage Webhooks permissions in this channel.",
		},
		{
			"user not in server",
			ChannelAccess{ChannelFound: true, BotPermissions: send},
			"You aren't a member of this server.",
		},
		{
			"user timed out",
			ChannelAccess{ChannelFound: true, UserInGuild: true, UserTimedOut: true, BotPermissions: send},
			"You're timed out in this server.",
		},
		{
			"user without permissions",
			ChannelAccess{ChannelFound: true, UserInGuild: true, BotPermissions: send},
			"You need the View Channel and Manage Webhooks permissions in this channel.",
		},
		{
			"both can send",
			ChannelAccess{ChannelFound: true, UserInGuild: true, BotPermissions: send, UserPermissions: send},
			"",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := deniedMessage(t, tt.access.Denied()); got != tt.want {
				t.Errorf("Denied() = %q, want %q", got, tt.want)
			}
		})
	}
}

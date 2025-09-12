package rest

import (
	"context"
	"errors"
	"io"

	"github.com/merlinfuchs/discordgo"
)

var ErrNotFound = errors.New("not found")

type RestClient interface {
	Request(ctx context.Context, method string, url string, body io.Reader, options ...discordgo.RequestOption) ([]byte, error)

	Guild(ctx context.Context, guildID string) (*discordgo.Guild, error)
	GuildChannels(ctx context.Context, guildID string) ([]*discordgo.Channel, error)
	GuildThreads(ctx context.Context, guildID string) ([]*discordgo.Channel, error)
	Channel(ctx context.Context, channelID string) (*discordgo.Channel, error)
	GuildMember(ctx context.Context, guildID string, userID string) (*discordgo.Member, error)
	GuildRoles(ctx context.Context, guildID string) ([]*discordgo.Role, error)
	GuildRole(ctx context.Context, guildID string, roleID string) (*discordgo.Role, error)

	// OAuth2
	OauthUser(ctx context.Context, accessToken string) (*discordgo.User, error)
	OauthUserGuilds(ctx context.Context, accessToken string) ([]*OauthUserGuild, error)
	OauthUserGuild(ctx context.Context, accessToken string, guildID string) (*OauthUserGuild, error)
}

type OauthUserGuild struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Icon        string `json:"icon"`
	OwnerID     string `json:"owner_id"`
	Owner       bool   `json:"owner"`
	Permissions int64  `json:"permissions"`
}

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

	GuildMember(ctx context.Context, guildID string, userID string) (*discordgo.Member, error)
}

package template

import (
	"context"
	"errors"
	"fmt"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

// Source resolves guild scoped data for template fields that are only evaluated if the template
// actually references them. It carries a context because text/template calls those methods with no
// way to pass one.
type Source struct {
	ctx        context.Context
	guildState *guildstate.Provider
	// Shared by every copy, so the providers and data built from this source report into it.
	internalErr *error
}

func NewSource(ctx context.Context, guildState *guildstate.Provider) Source {
	return Source{ctx: ctx, guildState: guildState, internalErr: new(error)}
}

// Err returns the first failure of a lookup behind the template, like the database or Discord
// being unavailable. The template library only keeps the text of a function's error, so this is
// how callers tell a failure on our side apart from a mistake in the template.
func (s Source) Err() error {
	if s.internalErr == nil {
		return nil
	}
	return *s.internalErr
}

// internal records err as a failure on our side unless it's a not found, which the template
// asked for.
func (s Source) internal(err error) error {
	if err != nil && s.internalErr != nil && *s.internalErr == nil && !errors.Is(err, store.ErrNotFound) {
		*s.internalErr = err
	}
	return err
}

func (s Source) guild(guildID common.ID) (*discord.Guild, error) {
	state, err := s.guildState.Guild(s.ctx, guildID)
	if err != nil {
		return nil, s.internal(err)
	}

	return &state.Guild, nil
}

func (s Source) channel(channelID common.ID) (discord.GuildChannel, error) {
	channel, err := s.guildState.Channel(s.ctx, channelID)
	return channel, s.internal(err)
}

func (s Source) role(guildID common.ID, roleID common.ID) (*discord.Role, error) {
	state, err := s.guildState.Guild(s.ctx, guildID)
	if err != nil {
		return nil, s.internal(err)
	}

	role, ok := state.Role(roleID)
	if !ok {
		return nil, fmt.Errorf("role %s not found", roleID)
	}

	return &role, nil
}

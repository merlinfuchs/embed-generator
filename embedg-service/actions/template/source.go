package template

import (
	"context"
	"fmt"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/guildstate"
)

// Source resolves guild scoped data for template fields that are only evaluated if the template
// actually references them. It carries a context because text/template calls those methods with no
// way to pass one.
type Source struct {
	ctx        context.Context
	guildState *guildstate.Provider
}

func NewSource(ctx context.Context, guildState *guildstate.Provider) Source {
	return Source{ctx: ctx, guildState: guildState}
}

func (s Source) guild(guildID common.ID) (*discord.Guild, error) {
	if s.guildState == nil {
		return nil, fmt.Errorf("no guild state available")
	}

	state, err := s.guildState.Guild(s.ctx, guildID)
	if err != nil {
		return nil, err
	}

	return &state.Guild, nil
}

func (s Source) channel(channelID common.ID) (discord.GuildChannel, error) {
	if s.guildState == nil {
		return nil, fmt.Errorf("no guild state available")
	}

	return s.guildState.Channel(s.ctx, channelID)
}

func (s Source) role(guildID common.ID, roleID common.ID) (*discord.Role, error) {
	if s.guildState == nil {
		return nil, fmt.Errorf("no guild state available")
	}

	state, err := s.guildState.Guild(s.ctx, guildID)
	if err != nil {
		return nil, err
	}

	role, ok := state.Role(roleID)
	if !ok {
		return nil, fmt.Errorf("role %s not found", roleID)
	}

	return &role, nil
}

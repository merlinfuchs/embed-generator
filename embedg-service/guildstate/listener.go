package guildstate

import (
	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/events"
)

// OnEvent keeps this instance's view fresh for the guilds it has a gateway connection for. Other
// instances pick the change up when the entry expires.
func (p *Provider) OnEvent(event bot.Event) {
	switch e := event.(type) {
	case *events.GuildUpdate:
		p.Invalidate(e.GuildID)
	case *events.GuildChannelCreate:
		p.Invalidate(e.GuildID)
		p.InvalidateChannel(e.ChannelID)
	case *events.GuildChannelUpdate:
		p.Invalidate(e.GuildID)
		p.InvalidateChannel(e.ChannelID)
	case *events.GuildChannelDelete:
		p.Invalidate(e.GuildID)
		p.InvalidateChannel(e.ChannelID)
	case *events.RoleCreate:
		p.Invalidate(e.GuildID)
	case *events.RoleUpdate:
		p.Invalidate(e.GuildID)
	case *events.RoleDelete:
		p.Invalidate(e.GuildID)
	}
}

package variables

import (
	"fmt"

	"github.com/merlinfuchs/discordgo"
	"github.com/rs/zerolog/log"
)

type GuildVariables struct {
	guildID string
	guild   *discordgo.Guild
	state   *discordgo.State
}

func NewGuildVariables(guildID string, state *discordgo.State, guild *discordgo.Guild) *GuildVariables {
	return &GuildVariables{
		guildID: guildID,
		guild:   guild,
		state:   state,
	}
}

func (v *GuildVariables) ensureGuild() bool {
	if v.guild != nil {
		return true
	}

	guild, err := v.state.Guild(v.guildID)
	if err != nil {
		if err == discordgo.ErrStateNotFound {
			return false
		}
		log.Error().Err(err).Msg("Failed to retrieve guild for variables")
		return false
	}

	v.guild = guild
	return true
}

func (v *GuildVariables) Get(keys ...string) *string {
	if len(keys) == 0 {
		return nil
	}

	if keys[0] != "guild" && keys[0] != "server" {
		return nil
	}

	if !v.ensureGuild() {
		return nil
	}

	if len(keys) == 1 {
		return &v.guild.Name
	}

	switch keys[1] {
	case "id":
		return &v.guild.ID
	case "name":
		return &v.guild.Name
	case "description":
		return &v.guild.Description
	case "icon":
		return &v.guild.Icon
	case "icon_url":
		v := v.guild.IconURL("512")
		return &v
	case "banner":
		return &v.guild.Banner
	case "banner_url":
		v := v.guild.BannerURL("1024")
		return &v
	case "member_count":
		v := fmt.Sprintf("%d", v.guild.MemberCount)
		return &v
	case "boost_count":
		v := fmt.Sprintf("%d", v.guild.PremiumSubscriptionCount)
		return &v
	case "boost_level":
		v := fmt.Sprintf("%d", v.guild.PremiumTier)
		return &v
	}

	return nil
}

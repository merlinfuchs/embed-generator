package variables

import "github.com/merlinfuchs/discordgo"

type ChannelVariables struct {
	channelID string
	channel   *discordgo.Channel
	state     *discordgo.State
}

func NewChannelVariables(channelID string, state *discordgo.State, channel *discordgo.Channel) *ChannelVariables {
	return &ChannelVariables{
		channelID: channelID,
		channel:   channel,
		state:     state,
	}
}

func (v *ChannelVariables) ensureChannel() bool {
	if v.channel != nil {
		return true
	}

	channel, err := v.state.Channel(v.channelID)
	if err != nil {
		if err == discordgo.ErrStateNotFound {
			return false
		}
		return false
	}

	v.channel = channel
	return true

}

func (v *ChannelVariables) Get(keys ...string) *string {
	if len(keys) == 0 {
		return nil
	}

	if keys[0] != "channel" {
		return nil
	}

	if !v.ensureChannel() {
		return nil
	}

	if len(keys) == 1 {
		m := v.channel.Mention()
		return &m
	}

	switch keys[1] {
	case "id":
		return &v.channel.ID
	case "name":
		return &v.channel.Name
	case "topic":
		return &v.channel.Topic
	case "mention":
		m := v.channel.Mention()
		return &m
	}

	return nil
}

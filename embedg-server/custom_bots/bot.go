package custom_bots

import (
	"github.com/merlinfuchs/discordgo"
	"github.com/rs/zerolog/log"
	"gopkg.in/guregu/null.v4"
)

type CustomBot struct {
	Presence CustomBotPresence `json:"status"`
	Session  *discordgo.Session
}

func NewCustomBot(token string, presence CustomBotPresence) (*CustomBot, error) {
	session, err := discordgo.New("Bot " + token)
	if err != nil {
		return nil, err
	}

	session.StateEnabled = false
	session.Identify.Intents = 0
	session.Identify.Presence = discordgo.GatewayStatusUpdate{
		Status: presence.Status,
		Game:   presence.Activity(),
	}

	err = session.Open()
	if err != nil {
		return nil, err
	}

	bot := &CustomBot{
		Presence: presence,
		Session:  session,
	}

	return bot, nil
}

func (b *CustomBot) UpdatePresence(p CustomBotPresence) {
	if b.Session == nil {
		return
	}

	activity := p.Activity()
	err := b.Session.UpdateStatusComplex(discordgo.UpdateStatusData{
		Status:     p.Status,
		Activities: []*discordgo.Activity{&activity},
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to update custom bot presence")
	} else {
		b.Presence = p
	}
}

type CustomBotPresence struct {
	Status        string      `json:"status"`
	ActivityType  null.Int    `json:"activity_type"`
	ActivityName  null.String `json:"activity_name"`
	ActivityState null.String `json:"activity_state"`
	ActivityURL   null.String `json:"activity_url"`
}

func (p CustomBotPresence) Activity() discordgo.Activity {
	return discordgo.Activity{
		Type:  discordgo.ActivityType(p.ActivityType.Int64),
		Name:  p.ActivityName.String,
		State: p.ActivityState.String,
		URL:   p.ActivityURL.String,
	}
}

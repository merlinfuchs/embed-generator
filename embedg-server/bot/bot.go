package bot

import (
	"github.com/bwmarrin/discordgo"
	"github.com/rs/zerolog/log"
)

type Bot struct {
	Session *discordgo.Session
	State   *discordgo.State
}

func New(token string) (*Bot, error) {
	session, err := discordgo.New("Bot " + token)
	if err != nil {
		return nil, err
	}

	state := discordgo.NewState()
	session.StateEnabled = true
	session.State = state

	return &Bot{
		Session: session,
		State:   state,
	}, nil
}

func (b *Bot) Start() error {
	err := b.Session.Open()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to open discord session")
	}
	return err
}

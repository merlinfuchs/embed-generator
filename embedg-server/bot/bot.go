package bot

import (
	"github.com/bwmarrin/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/sharding"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
)

type Bot struct {
	*sharding.ShardManager
	pg *postgres.PostgresStore
}

func New(token string, pg *postgres.PostgresStore) (*Bot, error) {
	manager, err := sharding.New("Bot " + token)
	if err != nil {
		return nil, err
	}

	manager.Intents = discordgo.IntentGuilds | discordgo.IntentGuildMessages | discordgo.IntentGuildEmojis // discordgo.IntentGuildMembers
	manager.State = discordgo.NewState()

	manager.AddHandler(onReady)
	manager.AddHandler(onConnect)
	manager.AddHandler(onDisconnect)
	manager.AddHandler(onResumed)

	b := &Bot{
		ShardManager: manager,
		pg:           pg,
	}

	b.AddHandler(b.onMessageDelete)

	return b, nil
}

func (b *Bot) Start() error {
	err := b.ShardManager.Start()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to open discord session")
	}
	return err
}

package bot

import (
	"github.com/bwmarrin/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/sharding"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
)

type Bot struct {
	*sharding.ShardManager
	pg            *postgres.PostgresStore
	actionHandler *handler.ActionHandler
}

func New(token string, pg *postgres.PostgresStore) (*Bot, error) {
	manager, err := sharding.New("Bot " + token)
	if err != nil {
		return nil, err
	}

	manager.Intents = discordgo.IntentGuilds | discordgo.IntentGuildMessages | discordgo.IntentGuildEmojis // discordgo.IntentGuildMembers
	manager.State = discordgo.NewState()

	b := &Bot{
		ShardManager:  manager,
		pg:            pg,
		actionHandler: handler.New(pg),
	}

	b.AddHandler(onReady)
	b.AddHandler(onConnect)
	b.AddHandler(onDisconnect)
	b.AddHandler(onResumed)
	b.AddHandler(b.onInteractionCreate)

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

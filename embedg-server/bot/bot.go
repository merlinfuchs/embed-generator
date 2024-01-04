package bot

import (
	_ "embed"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/sharding"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

//go:embed logo-512.png
var logoFile []byte

type Bot struct {
	*sharding.ShardManager
	pg            *postgres.PostgresStore
	ActionHandler *handler.ActionHandler
	ActionParser  *parser.ActionParser
}

func New(token string, pg *postgres.PostgresStore) (*Bot, error) {
	manager, err := sharding.New("Bot " + token)
	if err != nil {
		return nil, err
	}

	manager.Intents = discordgo.IntentGuilds | discordgo.IntentGuildMessages | discordgo.IntentGuildEmojis
	manager.State = discordgo.NewState()
	manager.Presence = &discordgo.GatewayStatusUpdate{
		Game: discordgo.Activity{
			Name: viper.GetString("discord.activity_name"),
			Type: discordgo.ActivityTypeWatching,
		},
		Status: string(discordgo.StatusOnline),
	}

	b := &Bot{
		ShardManager: manager,
		pg:           pg,
	}

	b.AddHandler(onReady)
	b.AddHandler(onConnect)
	b.AddHandler(onDisconnect)
	b.AddHandler(onResumed)
	b.AddHandler(b.onInteractionCreate)
	b.AddHandler(b.onEvent)

	b.AddHandler(b.onMessageDelete)

	go b.lazyTierTask()

	return b, nil
}

func (b *Bot) Start() error {
	err := b.RegisterCommand()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to register command")
		return err
	}

	err = b.ShardManager.Start()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to open discord session")
	}
	return err
}

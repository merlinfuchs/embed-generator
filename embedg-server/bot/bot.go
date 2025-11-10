package bot

import (
	_ "embed"
	"fmt"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/rest"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/sharding"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/stateway"
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

	State *discordgo.State
	Rest  *rest.RestClientWithCache

	Stateway *stateway.Client
}

func New(token string, pg *postgres.PostgresStore) (*Bot, error) {
	manager, err := sharding.New("Bot " + token)
	if err != nil {
		return nil, err
	}

	manager.Intents = discordgo.IntentGuilds | discordgo.IntentGuildMessages | discordgo.IntentGuildEmojis
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
		State:        discordgo.NewState(),
		Rest:         rest.NewRestClientWithCache(manager.Session),
	}

	natsURL := viper.GetString("nats.url")
	if natsURL != "" {
		stateway, err := stateway.NewClient(natsURL, manager)
		if err != nil {
			return nil, fmt.Errorf("failed to create stateway client: %w", err)
		}

		b.Stateway = stateway
	}

	b.AddHandler(onReady)
	b.AddHandler(onConnect)
	b.AddHandler(onDisconnect)
	b.AddHandler(onResumed)
	b.AddHandler(b.onInteractionCreate)
	b.AddHandler(b.onRawEvent)
	b.AddHandler(b.onInterface)

	b.AddHandler(b.onMessageDelete)
	b.AddHandler(b.onGuildMemberUpdate)
	b.AddHandler(b.onGuildMemberRemove)

	go b.lazyTierTask()

	return b, nil
}

func (b *Bot) Start() error {
	err := b.RegisterCommand()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to register command")
		return err
	}

	if b.Stateway != nil {
		log.Info().Msg("Stateway NATS configured, starting Stateway client instead of shards")
		err = b.Stateway.Start()
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to start stateway client")
			return err
		}
	} else {
		log.Info().Msg("No Stateway NATS configured, starting shards")
		err = b.ShardManager.Start()
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to open discord session")
		}
	}

	return err
}

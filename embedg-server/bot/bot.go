package bot

import (
	"github.com/bwmarrin/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/sharding"
	"github.com/rs/zerolog/log"
)

type Bot struct {
	*sharding.ShardManager
}

func New(token string) (*Bot, error) {
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

	return &Bot{
		ShardManager: manager,
	}, nil
}

func (b *Bot) Start() error {
	err := b.ShardManager.Start()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to open discord session")
	}
	return err
}

func onReady(s *discordgo.Session, r *discordgo.Ready) {
	log.Info().Msgf("Shard %d is ready", s.ShardID)
}

func onConnect(s *discordgo.Session, c *discordgo.Connect) {
	log.Info().Msgf("Shard %d connected", s.ShardID)
}

func onDisconnect(s *discordgo.Session, d *discordgo.Disconnect) {
	log.Info().Msgf("Shard %d disconnected", s.ShardID)
}

func onResumed(s *discordgo.Session, r *discordgo.Resumed) {
	log.Info().Msgf("Shard %d resumed", s.ShardID)
}

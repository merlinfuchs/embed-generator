package bot

import (
	_ "embed"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot/sharding"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"github.com/vincent-petithory/dataurl"
)

//go:embed logo-512.png
var logoFile []byte

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
	manager.Presence = &discordgo.GatewayStatusUpdate{
		Game: discordgo.Activity{
			Name: "message.style",
			Type: discordgo.ActivityTypeWatching,
		},
		Status: string(discordgo.StatusOnline),
	}

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

func (b *Bot) GetWebhookForChannel(channelID string) (*discordgo.Webhook, error) {
	channel, err := b.State.Channel(channelID)
	if err != nil {
		return nil, err
	}
	if channel.Type == discordgo.ChannelTypeGuildNewsThread || channel.Type == discordgo.ChannelTypeGuildPublicThread {
		channel, err = b.State.Channel(channel.ParentID)
		if err != nil {
			return nil, err
		}
	}

	webhooks, err := b.Session.ChannelWebhooks(channel.ID)
	if err != nil {
		return nil, err
	}

	for _, webhook := range webhooks {
		if webhook.ApplicationID == viper.GetString("discord.client_id") {
			return webhook, nil
		}
	}

	logoDataURL := dataurl.New(logoFile, "image/png")
	webhook, err := b.Session.WebhookCreate(channel.ID, "Embed Generator", logoDataURL.String())
	return webhook, err
}

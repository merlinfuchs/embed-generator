package custom_bots

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"
	"time"

	"github.com/disgoorg/disgo"
	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/gateway"
	"github.com/disgoorg/disgo/sharding"
	"github.com/merlinfuchs/embed-generator/embedg-server/embedg/rest"
	"github.com/rs/zerolog/log"
	"gopkg.in/guregu/null.v4"
)

type CustomBot struct {
	Presence CustomBotPresence `json:"status"`
	Client   *bot.Client
}

func NewCustomBot(token string, presence CustomBotPresence) (*CustomBot, error) {
	client, err := disgo.New(token,
		bot.WithShardManagerConfigOpts(
			sharding.WithAutoScaling(false),
			sharding.WithGatewayConfigOpts(
				gateway.WithIntents(),
				gateway.WithPresenceOpts(presence.PresenceOpts()...),
			),
		),
		bot.WithEventManagerConfigOpts(
			bot.WithAsyncEventsEnabled(),
		),
		bot.WithRestClient(rest.NewRestClient(token)),
		bot.WithCacheConfigOpts(
			cache.WithCaches(),
		),
		bot.WithEventListenerFunc(func(e *events.Ready) {
			slog.Info(
				"Shard is ready",
				slog.String("shard_id", strconv.Itoa(e.ShardID())),
				slog.String("user_id", e.User.ID.String()),
				slog.String("username", e.User.Username),
			)
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	err = client.OpenShardManager(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to open session: %w", err)
	}

	bot := &CustomBot{
		Presence: presence,
		Client:   client,
	}

	return bot, nil
}

func (b *CustomBot) UpdatePresence(p CustomBotPresence) {
	if b.Client == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := b.Client.SetPresence(ctx, p.PresenceOpts()...)
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

func (p CustomBotPresence) PresenceOpts() []gateway.PresenceOpt {

	opts := []gateway.PresenceOpt{
		gateway.WithOnlineStatus(discord.OnlineStatus(p.Status)),
	}
	if p.ActivityType.Valid {
		extraOpts := []gateway.ActivityOpt{}
		if p.ActivityState.Valid {
			extraOpts = append(extraOpts, gateway.WithActivityState(p.ActivityState.String))
		}

		switch discord.ActivityType(p.ActivityType.Int64) {
		case discord.ActivityTypeCustom:
			opts = append(opts, gateway.WithCustomActivity(p.ActivityName.String, extraOpts...))
		case discord.ActivityTypeGame:
			opts = append(opts, gateway.WithPlayingActivity(p.ActivityName.String, extraOpts...))
		case discord.ActivityTypeWatching:
			opts = append(opts, gateway.WithWatchingActivity(p.ActivityName.String, extraOpts...))
		case discord.ActivityTypeStreaming:
			opts = append(opts, gateway.WithStreamingActivity(p.ActivityName.String, p.ActivityURL.String, extraOpts...))
		case discord.ActivityTypeListening:
			opts = append(opts, gateway.WithListeningActivity(p.ActivityName.String, extraOpts...))
		case discord.ActivityTypeCompeting:
			opts = append(opts, gateway.WithCompetingActivity(p.ActivityName.String, extraOpts...))
		}
	}

	return opts
}

package custom_bot

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/gateway"
	"github.com/gorilla/websocket"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

const openTimeout = 30 * time.Second

// runningBot is a gateway connection for a custom bot. Custom bots are connected purely to show
// a presence in Discord, they receive no events. Their interactions arrive over HTTP on the
// interaction endpoint instead.
type runningBot struct {
	gateway  gateway.Gateway
	token    string
	presence presenceConfig
}

// presenceConfig is the comparable part of a custom bot's presence, so we can tell whether a
// running bot already displays what the database says it should.
type presenceConfig struct {
	status        string
	activityType  int64
	activityName  string
	activityState string
	activityURL   string
}

func presenceConfigFromCustomBot(customBot *model.CustomBot) presenceConfig {
	return presenceConfig{
		status:        customBot.GatewayStatus,
		activityType:  customBot.GatewayActivityType.Int64,
		activityName:  customBot.GatewayActivityName.String,
		activityState: customBot.GatewayActivityState.String,
		activityURL:   customBot.GatewayActivityUrl.String,
	}
}

func (p presenceConfig) opts() []gateway.PresenceOpt {
	opts := []gateway.PresenceOpt{
		gateway.WithOnlineStatus(discord.OnlineStatus(p.status)),
	}

	activityOpts := []gateway.ActivityOpt{}
	if p.activityState != "" {
		activityOpts = append(activityOpts, gateway.WithActivityState(p.activityState))
	}

	switch discord.ActivityType(p.activityType) {
	case discord.ActivityTypeCustom:
		if p.activityState != "" {
			opts = append(opts, gateway.WithCustomActivity(p.activityState))
		}
	case discord.ActivityTypeStreaming:
		if p.activityName != "" {
			opts = append(opts, gateway.WithStreamingActivity(p.activityName, p.activityURL, activityOpts...))
		}
	case discord.ActivityTypeListening:
		if p.activityName != "" {
			opts = append(opts, gateway.WithListeningActivity(p.activityName, activityOpts...))
		}
	case discord.ActivityTypeWatching:
		if p.activityName != "" {
			opts = append(opts, gateway.WithWatchingActivity(p.activityName, activityOpts...))
		}
	case discord.ActivityTypeCompeting:
		if p.activityName != "" {
			opts = append(opts, gateway.WithCompetingActivity(p.activityName, activityOpts...))
		}
	default:
		if p.activityName != "" {
			opts = append(opts, gateway.WithPlayingActivity(p.activityName, activityOpts...))
		}
	}

	return opts
}

// data builds the presence update message, so a presence change doesn't need a reconnect.
func (p presenceConfig) data() gateway.MessageDataPresenceUpdate {
	data := gateway.MessageDataPresenceUpdate{}
	for _, opt := range p.opts() {
		opt(&data)
	}
	return data
}

// openGateway connects a custom bot to the gateway. It blocks until the connection is ready.
func openGateway(ctx context.Context, customBot *model.CustomBot, presence presenceConfig, closeHandler gateway.CloseHandlerFunc) (gateway.Gateway, error) {
	gw := gateway.New(
		customBot.Token,
		func(gateway.Gateway, gateway.EventType, int, gateway.EventData) {},
		gateway.WithPresenceOpts(presence.opts()...),
		gateway.WithCloseHandler(closeHandler),
		gateway.WithLogger(slog.With(slog.String("custom_bot_id", customBot.ID))),
	)

	ctx, cancel := context.WithTimeout(ctx, openTimeout)
	defer cancel()

	if err := gw.Open(ctx); err != nil {
		return nil, err
	}

	return gw, nil
}

// isAuthenticationFailure reports whether Discord rejected the bot token.
func isAuthenticationFailure(err error) bool {
	var closeErr *websocket.CloseError
	return errors.As(err, &closeErr) && closeErr.Code == gateway.CloseEventCodeAuthenticationFailed.Code
}

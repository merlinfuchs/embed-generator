package custom_bot

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/gateway"
	"github.com/gorilla/websocket"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
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

// botRef identifies a custom bot without holding on to the row it came from. The close handler
// outlives the sync that started the connection, and capturing the model would pin every custom
// bot row that sync loaded.
type botRef struct {
	id            string
	applicationID common.ID
	guildID       common.ID
}

func refFromCustomBot(customBot *model.CustomBot) botRef {
	return botRef{
		id:            customBot.ID,
		applicationID: customBot.ApplicationID,
		guildID:       customBot.GuildID,
	}
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

func (p presenceConfig) data() gateway.MessageDataPresenceUpdate {
	data := gateway.MessageDataPresenceUpdate{
		Status: discord.OnlineStatus(p.status),
	}

	activity := discord.Activity{
		Type: discord.ActivityType(p.activityType),
		Name: p.activityName,
	}
	if activity.Type == discord.ActivityTypeCustom {
		// Discord shows the state for a custom status and expects this exact name.
		activity.Name = "Custom Status"
		if p.activityState == "" {
			return data
		}
	} else if p.activityName == "" {
		return data
	}

	if p.activityState != "" {
		activity.State = &p.activityState
	}
	if p.activityURL != "" {
		activity.URL = &p.activityURL
	}
	data.Activities = []discord.Activity{activity}

	return data
}

// opt passes the presence along with the identify payload, so a bot is never briefly online
// without it.
func (p presenceConfig) opt() gateway.PresenceOpt {
	return func(update *gateway.MessageDataPresenceUpdate) {
		*update = p.data()
	}
}

// openGateway connects a custom bot to the gateway. It blocks until the connection is ready.
func openGateway(ctx context.Context, ref botRef, token string, presence presenceConfig, closeHandler gateway.CloseHandlerFunc) (gateway.Gateway, error) {
	gw := gateway.New(
		token,
		func(gateway.Gateway, gateway.EventType, int, gateway.EventData) {},
		gateway.WithPresenceOpts(presence.opt()),
		gateway.WithCloseHandler(closeHandler),
		gateway.WithLogger(slog.With(slog.String("custom_bot_id", ref.id))),
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
	if !errors.As(err, &closeErr) {
		return false
	}
	return gateway.CloseEventCodeByCode(closeErr.Code) == gateway.CloseEventCodeAuthenticationFailed
}

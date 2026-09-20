package custom_bot

import (
	"context"
	"errors"
	"log/slog"
	"sync"
	"time"

	"github.com/disgoorg/disgo/gateway"
	disrest "github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"golang.org/x/sync/errgroup"
)

const (
	syncInterval = 5 * time.Minute
	// How many custom bots we connect at the same time when catching up after a restart.
	syncConcurrency = 10
)

type CustomBotManager struct {
	store.CustomBotStore
	rest disrest.Rest

	syncRequests chan struct{}

	// bots is only written by Run's goroutine, the lock is for readers like Status.
	botsMu sync.Mutex
	bots   map[common.ID]*runningBot
}

func NewCustomBotManager(
	customBotStore store.CustomBotStore,
	rest disrest.Rest,
) *CustomBotManager {
	return &CustomBotManager{
		CustomBotStore: customBotStore,
		rest:           rest,
		syncRequests:   make(chan struct{}, 1),
		bots:           make(map[common.ID]*runningBot),
	}
}

func (m *CustomBotManager) Run(ctx context.Context) {
	syncTicker := time.NewTicker(syncInterval)
	defer syncTicker.Stop()

	for {
		if err := m.syncCustomBots(ctx); err != nil {
			slog.Error("Failed to sync custom bots", slog.Any("error", err))
		}

		select {
		case <-syncTicker.C:
		case <-m.syncRequests:
		case <-ctx.Done():
			m.stopAll()
			return
		}
	}
}

// RequestSync asks the manager to reconcile the running custom bots as soon as possible.
// It never blocks, a sync that is already pending covers the request.
func (m *CustomBotManager) RequestSync() {
	select {
	case m.syncRequests <- struct{}{}:
	default:
	}
}

// Status returns the gateway status of a custom bot, or StatusUnconnected if it isn't running.
func (m *CustomBotManager) Status(applicationID common.ID) gateway.Status {
	m.botsMu.Lock()
	defer m.botsMu.Unlock()

	bot, ok := m.bots[applicationID]
	if !ok {
		return gateway.StatusUnconnected
	}
	return bot.gateway.Status()
}

// syncCustomBots reconciles the running gateway connections with the custom bots in the database.
func (m *CustomBotManager) syncCustomBots(ctx context.Context) error {
	customBots, err := m.GetCustomBots(ctx)
	if err != nil {
		return err
	}

	wanted := make(map[common.ID]struct{}, len(customBots))
	toStart := make([]*model.CustomBot, 0)

	for i := range customBots {
		customBot := &customBots[i]
		if customBot.Token == "" || customBot.TokenInvalid {
			continue
		}
		wanted[customBot.ApplicationID] = struct{}{}

		running := m.runningBot(customBot.ApplicationID)
		if running == nil {
			toStart = append(toStart, customBot)
			continue
		}

		if running.token != customBot.Token {
			m.stopBot(customBot.ApplicationID)
			toStart = append(toStart, customBot)
			continue
		}

		if presence := presenceConfigFromCustomBot(customBot); presence != running.presence {
			m.updatePresence(customBot.ApplicationID, presence)
		}
	}

	for _, applicationID := range m.runningIDs() {
		if _, ok := wanted[applicationID]; !ok {
			m.stopBot(applicationID)
		}
	}

	var group errgroup.Group
	group.SetLimit(syncConcurrency)
	for _, customBot := range toStart {
		group.Go(func() error {
			m.startBot(ctx, customBot)
			return nil
		})
	}
	return group.Wait()
}

func (m *CustomBotManager) startBot(ctx context.Context, customBot *model.CustomBot) {
	presence := presenceConfigFromCustomBot(customBot)

	gw, err := openGateway(ctx, customBot, presence, func(gw gateway.Gateway, err error, _ bool) {
		m.onGatewayClose(customBot, gw, err)
	})
	if err != nil {
		if isAuthenticationFailure(err) {
			m.markTokenInvalid(customBot)
		} else {
			slog.Error(
				"Failed to connect custom bot to the gateway",
				slog.String("custom_bot_id", customBot.ID),
				slog.Any("error", err),
			)
		}
		return
	}

	m.botsMu.Lock()
	defer m.botsMu.Unlock()
	m.bots[customBot.ApplicationID] = &runningBot{
		gateway:  gw,
		token:    customBot.Token,
		presence: presence,
	}
}

func (m *CustomBotManager) stopBot(applicationID common.ID) {
	m.botsMu.Lock()
	bot, ok := m.bots[applicationID]
	delete(m.bots, applicationID)
	m.botsMu.Unlock()

	if ok {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		bot.gateway.Close(ctx)
	}
}

func (m *CustomBotManager) stopAll() {
	for _, applicationID := range m.runningIDs() {
		m.stopBot(applicationID)
	}
}

func (m *CustomBotManager) updatePresence(applicationID common.ID, presence presenceConfig) {
	bot := m.runningBot(applicationID)
	if bot == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := bot.gateway.Send(ctx, gateway.OpcodePresenceUpdate, presence.data()); err != nil {
		slog.Error("Failed to update custom bot presence", slog.Any("error", err))
		return
	}

	m.botsMu.Lock()
	defer m.botsMu.Unlock()
	bot.presence = presence
}

// onGatewayClose runs when a connection died in a way it can't recover from on its own.
// The bot is dropped from the pool and the next sync reconnects it, unless the token is gone.
func (m *CustomBotManager) onGatewayClose(customBot *model.CustomBot, gw gateway.Gateway, err error) {
	if isAuthenticationFailure(err) {
		m.markTokenInvalid(customBot)
	} else {
		slog.Error(
			"Custom bot gateway connection closed",
			slog.String("custom_bot_id", customBot.ID),
			slog.Any("error", err),
		)
	}

	m.botsMu.Lock()
	defer m.botsMu.Unlock()
	if bot, ok := m.bots[customBot.ApplicationID]; ok && bot.gateway == gw {
		delete(m.bots, customBot.ApplicationID)
	}
}

func (m *CustomBotManager) markTokenInvalid(customBot *model.CustomBot) {
	slog.Warn("Custom bot token was rejected by Discord", slog.String("custom_bot_id", customBot.ID))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if _, err := m.UpdateCustomBotTokenInvalid(ctx, customBot.GuildID); err != nil {
		slog.Error("Failed to mark custom bot token as invalid", slog.Any("error", err))
	}
}

func (m *CustomBotManager) runningBot(applicationID common.ID) *runningBot {
	m.botsMu.Lock()
	defer m.botsMu.Unlock()
	return m.bots[applicationID]
}

func (m *CustomBotManager) runningIDs() []common.ID {
	m.botsMu.Lock()
	defer m.botsMu.Unlock()

	ids := make([]common.ID, 0, len(m.bots))
	for applicationID := range m.bots {
		ids = append(ids, applicationID)
	}
	return ids
}

// GetRestForGuild returns the rest client for the given guild.
// If a custom bot is configured for the guild, the token of the custom bot will be used to create the rest client.
// Otherwise, the default rest client will be returned.
func (m *CustomBotManager) GetRestForGuild(ctx context.Context, guildID common.ID) (disrest.Rest, *model.CustomBot, error) {
	customBot, err := m.CustomBotStore.GetCustomBotByGuildID(ctx, guildID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return m.rest, nil, nil
		}
		return nil, nil, err
	}

	if customBot.Token == "" || customBot.TokenInvalid {
		return m.rest, nil, nil
	}

	return rest.NewRestClient(customBot.Token), customBot, nil
}

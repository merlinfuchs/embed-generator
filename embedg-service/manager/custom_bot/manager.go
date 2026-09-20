package custom_bot

import (
	"context"
	"errors"
	"log/slog"
	"maps"
	"slices"
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
	// How many custom bots we connect, disconnect or update at the same time.
	syncConcurrency = 10
	gatewayTimeout  = 5 * time.Second
)

type CustomBotManager struct {
	store.CustomBotStore
	rest disrest.Rest

	syncRequests chan struct{}

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

// The store methods that change which bots should be running reconcile afterwards, so no caller
// has to remember to. Everything writing custom bots goes through the manager.

func (m *CustomBotManager) UpsertCustomBot(ctx context.Context, customBot model.CustomBot) (*model.CustomBot, error) {
	return m.syncAfterWrite(m.CustomBotStore.UpsertCustomBot(ctx, customBot))
}

func (m *CustomBotManager) UpdateCustomBotPresence(ctx context.Context, params store.UpdateCustomBotPresenceParams) (*model.CustomBot, error) {
	return m.syncAfterWrite(m.CustomBotStore.UpdateCustomBotPresence(ctx, params))
}

func (m *CustomBotManager) DeleteCustomBot(ctx context.Context, guildID common.ID) (*model.CustomBot, error) {
	return m.syncAfterWrite(m.CustomBotStore.DeleteCustomBot(ctx, guildID))
}

// syncAfterWrite asks for a reconcile as soon as possible. It never blocks, a sync that is
// already pending covers the request.
func (m *CustomBotManager) syncAfterWrite(customBot *model.CustomBot, err error) (*model.CustomBot, error) {
	if err == nil {
		select {
		case m.syncRequests <- struct{}{}:
		default:
		}
	}
	return customBot, err
}

// syncCustomBots reconciles the running gateway connections with the custom bots in the database.
func (m *CustomBotManager) syncCustomBots(ctx context.Context) error {
	customBots, err := m.GetCustomBots(ctx)
	if err != nil {
		return err
	}

	var group errgroup.Group
	group.SetLimit(syncConcurrency)

	wanted := make(map[common.ID]struct{}, len(customBots))
	for i := range customBots {
		customBot := customBots[i]
		if !customBot.TokenUsable() {
			continue
		}
		if _, ok := wanted[customBot.ApplicationID]; ok {
			// Two guilds can be configured with the same bot, which still needs one connection.
			continue
		}
		wanted[customBot.ApplicationID] = struct{}{}

		running := m.runningBot(customBot.ApplicationID)
		presence := presenceConfigFromCustomBot(&customBot)

		switch {
		case running == nil:
			group.Go(func() error {
				m.startBot(ctx, customBot)
				return nil
			})
		case running.token != customBot.Token:
			group.Go(func() error {
				m.stopBot(customBot.ApplicationID)
				m.startBot(ctx, customBot)
				return nil
			})
		case running.presence != presence:
			group.Go(func() error {
				m.updatePresence(running, presence)
				return nil
			})
		}
	}

	for _, applicationID := range m.runningIDs() {
		if _, ok := wanted[applicationID]; !ok {
			group.Go(func() error {
				m.stopBot(applicationID)
				return nil
			})
		}
	}

	return group.Wait()
}

func (m *CustomBotManager) startBot(ctx context.Context, customBot model.CustomBot) {
	ref := refFromCustomBot(&customBot)
	presence := presenceConfigFromCustomBot(&customBot)

	gw, err := openGateway(ctx, ref, customBot.Token, presence, func(gw gateway.Gateway, err error, _ bool) {
		m.onGatewayClose(ref, gw, err)
	})
	if err != nil {
		if isAuthenticationFailure(err) {
			m.markTokenInvalid(ref)
		} else {
			slog.Error(
				"Failed to connect custom bot to the gateway",
				slog.String("custom_bot_id", ref.id),
				slog.Any("error", err),
			)
		}
		return
	}

	m.botsMu.Lock()
	defer m.botsMu.Unlock()
	m.bots[ref.applicationID] = &runningBot{
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
		ctx, cancel := context.WithTimeout(context.Background(), gatewayTimeout)
		defer cancel()
		bot.gateway.Close(ctx)
	}
}

func (m *CustomBotManager) stopAll() {
	var group errgroup.Group
	group.SetLimit(syncConcurrency)

	for _, applicationID := range m.runningIDs() {
		group.Go(func() error {
			m.stopBot(applicationID)
			return nil
		})
	}
	group.Wait()
}

func (m *CustomBotManager) updatePresence(bot *runningBot, presence presenceConfig) {
	ctx, cancel := context.WithTimeout(context.Background(), gatewayTimeout)
	defer cancel()

	if err := bot.gateway.Send(ctx, gateway.OpcodePresenceUpdate, presence.data()); err != nil {
		slog.Error("Failed to update custom bot presence", slog.Any("error", err))
		return
	}

	m.botsMu.Lock()
	defer m.botsMu.Unlock()
	bot.presence = presence
}

// onGatewayClose runs when a connection died in a way it can't recover from on its own. disgo
// logs the close itself. The bot is dropped from the pool and the next sync reconnects it,
// unless the token is gone.
func (m *CustomBotManager) onGatewayClose(ref botRef, gw gateway.Gateway, err error) {
	if isAuthenticationFailure(err) {
		m.markTokenInvalid(ref)
	}

	m.botsMu.Lock()
	defer m.botsMu.Unlock()
	if bot, ok := m.bots[ref.applicationID]; ok && bot.gateway == gw {
		delete(m.bots, ref.applicationID)
	}
}

func (m *CustomBotManager) markTokenInvalid(ref botRef) {
	slog.Warn("Custom bot token was rejected by Discord", slog.String("custom_bot_id", ref.id))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if _, err := m.UpdateCustomBotTokenInvalid(ctx, ref.guildID); err != nil {
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
	return slices.Collect(maps.Keys(m.bots))
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

	if !customBot.TokenUsable() {
		return m.rest, nil, nil
	}

	return rest.NewRestClient(customBot.Token), customBot, nil
}

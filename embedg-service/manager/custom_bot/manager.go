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
	rest   disrest.Rest
	shards common.Shards

	syncRequests chan struct{}

	botsMu sync.Mutex
	bots   map[common.ID]*runningBot
}

func NewCustomBotManager(
	customBotStore store.CustomBotStore,
	rest disrest.Rest,
	shards common.Shards,
) *CustomBotManager {
	return &CustomBotManager{
		CustomBotStore: customBotStore,
		rest:           rest,
		shards:         shards,
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
		// Partitioned on the application rather than the guild: two guilds can be configured with
		// the same bot, and hashing the guild would put one connection on each of two instances.
		if !customBot.TokenUsable() || !m.shards.Owns(customBot.ApplicationID) {
			continue
		}
		if _, ok := wanted[customBot.ApplicationID]; ok {
			continue
		}
		wanted[customBot.ApplicationID] = struct{}{}

		running, ok := m.runningBot(customBot.ApplicationID)
		presence := presenceConfigFromCustomBot(&customBot)

		switch {
		case !ok:
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
				m.updatePresence(customBot.ApplicationID, running.gateway, presence)
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
		if errors.Is(err, context.Canceled) {
			// Shutting down mid connect, not a failure.
		} else if isAuthenticationFailure(err) {
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

func (m *CustomBotManager) updatePresence(applicationID common.ID, gw gateway.Gateway, presence presenceConfig) {
	ctx, cancel := context.WithTimeout(context.Background(), gatewayTimeout)
	defer cancel()

	if err := gw.Send(ctx, gateway.OpcodePresenceUpdate, presence.data()); err != nil {
		slog.Error("Failed to update custom bot presence", slog.Any("error", err))
		return
	}

	m.botsMu.Lock()
	defer m.botsMu.Unlock()
	// The connection may have been replaced while we were sending; don't stamp the new one.
	if bot, ok := m.bots[applicationID]; ok && bot.gateway == gw {
		bot.presence = presence
	}
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

// runningBot returns a copy taken under the lock, so callers compare a consistent snapshot
// rather than racing updatePresence.
func (m *CustomBotManager) runningBot(applicationID common.ID) (runningBot, bool) {
	m.botsMu.Lock()
	defer m.botsMu.Unlock()
	bot, ok := m.bots[applicationID]
	if !ok {
		return runningBot{}, false
	}
	return *bot, true
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

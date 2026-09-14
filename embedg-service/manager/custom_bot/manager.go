package custom_bot

import (
	"context"
	"errors"
	"time"

	disrest "github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/embedg/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/merlinfuchs/stateway/stateway-lib/gateway"
)

type CustomBotManager struct {
	store.CustomBotStore
	rest    disrest.Rest
	gateway gateway.Gateway
}

func NewCustomBotManager(
	customBotStore store.CustomBotStore,
	rest disrest.Rest,
	gateway gateway.Gateway,
) *CustomBotManager {
	return &CustomBotManager{
		CustomBotStore: customBotStore,
		rest:           rest,
		gateway:        gateway,
	}
}

func (m *CustomBotManager) Run(ctx context.Context) {
	syncTicker := time.NewTicker(time.Minute * 15)
	defer syncTicker.Stop()

	for {
		select {
		case <-syncTicker.C:
			/* err := m.SyncCustomBots(ctx)
			if err != nil {
				slog.Error("Failed to sync custom bots", slog.Any("error", err))
				continue
			} */
		case <-ctx.Done():
			return
		}
	}
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

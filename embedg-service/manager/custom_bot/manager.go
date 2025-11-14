package custom_bot

import (
	"context"
	"errors"

	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

type CustomBotManager struct {
	store.CustomBotStore
	rest rest.Rest
}

func NewCustomBotManager(customBotStore store.CustomBotStore, rest rest.Rest) *CustomBotManager {
	return &CustomBotManager{
		CustomBotStore: customBotStore,
		rest:           rest,
	}
}

// GetRestForGuild returns the rest client for the given guild.
// If a custom bot is configured for the guild, the token of the custom bot will be used to create the rest client.
// Otherwise, the default rest client will be returned.
func (m *CustomBotManager) GetRestForGuild(ctx context.Context, guildID common.ID) (rest.Rest, *model.CustomBot, error) {
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

	return rest.New(rest.NewClient(customBot.Token)), customBot, nil
}

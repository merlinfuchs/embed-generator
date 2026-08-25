package custom_bot

import (
	"context"
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/stateway/stateway-lib/gateway"
	"gopkg.in/guregu/null.v4"
)

const GatewayGroupID = "custom"

func (m *CustomBotManager) SyncCustomBots(ctx context.Context) error {
	customBots, err := m.GetCustomBots(ctx)
	if err != nil {
		return err
	}

	apps, err := m.gateway.GetApps(ctx, gateway.ListAppsRequest{
		GroupID: null.StringFrom(GatewayGroupID),
	})
	if err != nil {
		return fmt.Errorf("failed to get configured apps: %w", err)
	}

	appsMap := make(map[common.ID]*gateway.App, len(apps))
	for _, app := range apps {
		appsMap[app.ID] = app
	}

	for _, customBot := range customBots {
		app, ok := appsMap[customBot.ApplicationID]
		if ok && app.DiscordBotToken == customBot.Token {
			continue
		}

		params := AppFromCustomBot(&customBot)

		_, err = m.gateway.UpsertApp(ctx, params)
		if err != nil {
			return fmt.Errorf("failed to upsert custom bot: %w", err)
		}
	}

	return nil
}

func AppFromCustomBot(customBot *model.CustomBot) gateway.UpsertAppRequest {
	presence := &gateway.AppPresenceConfig{
		Status: null.NewString(customBot.GatewayStatus, customBot.GatewayStatus != ""),
	}
	if customBot.GatewayActivityName.Valid {
		presence.Activity = &gateway.AppPresenceActivityConfig{
			Name:  customBot.GatewayActivityName.String,
			State: customBot.GatewayActivityState.String,
			URL:   customBot.GatewayActivityUrl.String,
		}
	}

	return gateway.UpsertAppRequest{
		ID:               customBot.ApplicationID,
		GroupID:          GatewayGroupID,
		DisplayName:      customBot.UserName,
		DiscordClientID:  customBot.ApplicationID,
		DiscordBotToken:  customBot.Token,
		DiscordPublicKey: customBot.PublicKey,
		ShardCount:       1,
		Config: gateway.AppConfig{
			Presence: presence,
		},
	}
}

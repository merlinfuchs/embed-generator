package custom_bots

import (
	"context"
	"errors"
	"time"

	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/events"
	"github.com/gorilla/websocket"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/rs/zerolog/log"
	"gopkg.in/guregu/null.v4"
)

type CustomBotManager struct {
	pg            *postgres.PostgresStore
	actionHandler *handler.ActionHandler
	bots          map[string]*CustomBot
}

func NewCustomBotManager(pg *postgres.PostgresStore, actionHandler *handler.ActionHandler) *CustomBotManager {
	m := &CustomBotManager{
		pg:            pg,
		actionHandler: actionHandler,
		bots:          make(map[string]*CustomBot),
	}

	// TODO: Re-enable once debugged
	// go m.lazyCustomBotGatewayTask()

	return m
}

func (m *CustomBotManager) lazyCustomBotGatewayTask() {
	for {
		time.Sleep(30 * time.Second)

		customBots, err := m.pg.Q.GetCustomBots(context.Background())
		if err != nil {
			log.Error().Err(err).Msg("Failed to retrieve custom bots")
			continue
		}

		newBots := 0
		for _, customBot := range customBots {
			if customBot.TokenInvalid {
				continue
			}

			presence := CustomBotPresence{
				Status:        customBot.GatewayStatus,
				ActivityType:  null.NewInt(int64(customBot.GatewayActivityType.Int16), customBot.GatewayActivityType.Valid),
				ActivityName:  null.String{NullString: customBot.GatewayActivityName},
				ActivityState: null.String{NullString: customBot.GatewayActivityState},
				ActivityURL:   null.String{NullString: customBot.GatewayActivityUrl},
			}

			if instance, ok := m.bots[customBot.ID]; ok {
				if instance.Presence != presence {
					instance.UpdatePresence(presence)
				}
				continue
			}

			instance, err := NewCustomBot(customBot.Token, presence)
			if err != nil {
				var wsErr *websocket.CloseError
				if errors.As(err, &wsErr) && wsErr.Code == 4004 {
					_, err := m.pg.Q.UpdateCustomBotTokenInvalid(context.Background(), pgmodel.UpdateCustomBotTokenInvalidParams{
						GuildID:      customBot.GuildID,
						TokenInvalid: true,
					})
					if err != nil {
						log.Error().Err(err).Msg("Failed to set custom bot token invalid")
					}
					continue
				}

				log.Error().Err(err).Msg("Failed to create custom bot")
				continue
			}

			instance.Client.AddEventListeners(bot.NewListenerFunc(func(i *events.InteractionCreate) {
				err = m.pg.Q.SetCustomBotHandledFirstInteraction(context.Background(), customBot.ID)
				if err != nil {
					log.Error().Err(err).Msg("Failed to set custom bot handled first interaction")
				}

				err := m.actionHandler.HandleActionInteraction(instance.Client.Rest, &handler.GatewayInteraction{
					Rest:  instance.Client.Rest,
					Inner: i.Interaction,
				})
				if err != nil {
					log.Error().Err(err).Msg("Failed to handle action interaction from custom bot gateway")
				}
			}))

			// TODO: Re-implement token reset detection
			/* instance.Client.AddEventListeners(bot.NewListenerFunc(func(i *events.Disconnect) {
				// Normally DiscordGo would handle reconnection, but it doesn't have any logic to detect a token reset and will just keep trying to reconnect with the old token
				// We only make a single reconnect attempt, if that fails we hand it off to the background task to spawn a new session
				// The background task will detect if the token is invalid and mark the custom bot accordingly

				err := s.Open()
				if err != nil {
					log.Error().Err(err).Msg("Failed to reconnect custom bot")

					delete(m.bots, customBot.ID)
				}
			})) */

			m.bots[customBot.ID] = instance
			newBots++
		}

		if newBots > 0 {
			log.Info().Msgf("%d custom bots connected to the gateway", newBots)
		}
	}
}

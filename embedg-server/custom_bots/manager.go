package custom_bots

import (
	"context"
	"errors"
	"time"

	"github.com/gorilla/websocket"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
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
		pg:   pg,
		bots: make(map[string]*CustomBot),
	}

	go m.lazyCustomBotGatewayTask()

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

			if bot, ok := m.bots[customBot.ID]; ok {
				if bot.Presence != presence {
					bot.UpdatePresence(presence)
				}
				continue
			}

			bot, err := NewCustomBot(customBot.Token, presence)
			if err != nil {
				var wsErr *websocket.CloseError
				if errors.As(err, &wsErr) && wsErr.Code == 4004 {
					_, err := m.pg.Q.UpdateCustomBotTokenInvalid(context.Background(), postgres.UpdateCustomBotTokenInvalidParams{
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

			bot.Session.AddHandler(func(s *discordgo.Session, i *discordgo.InteractionCreate) {
				err := m.actionHandler.HandleActionInteraction(s, &handler.GatewayInteraction{
					Session: s,
					Inner:   i.Interaction,
				})
				if err != nil {
					log.Error().Err(err).Msg("Failed to handle action interaction from custom bot gateway")
				}
			})

			m.bots[customBot.ID] = bot
		}
	}
}

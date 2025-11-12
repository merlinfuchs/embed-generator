package store

import (
	"context"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"gopkg.in/guregu/null.v4"
)

type UpdateCustomBotUserParams struct {
	GuildID           common.ID
	UserName          string
	UserDiscriminator string
	UserAvatar        null.String
}

type UpdateCustomBotPresenceParams struct {
	GuildID              common.ID
	GatewayStatus        string
	GatewayActivityType  null.Int
	GatewayActivityName  null.String
	GatewayActivityState null.String
	GatewayActivityUrl   null.String
}

type CustomBotStore interface {
	UpsertCustomBot(ctx context.Context, customBot model.CustomBot) (*model.CustomBot, error)
	UpdateCustomBotPresence(ctx context.Context, params UpdateCustomBotPresenceParams) (*model.CustomBot, error)
	UpdateCustomBotUser(ctx context.Context, params UpdateCustomBotUserParams) (*model.CustomBot, error)
	UpdateCustomBotTokenInvalid(ctx context.Context, guildID common.ID) (*model.CustomBot, error)
	DeleteCustomBot(ctx context.Context, guildID common.ID) (*model.CustomBot, error)
	GetCustomBot(ctx context.Context, id string) (*model.CustomBot, error)
	GetCustomBotByGuildID(ctx context.Context, guildID common.ID) (*model.CustomBot, error)
	SetCustomBotHandledFirstInteraction(ctx context.Context, id string) error
	GetCustomBots(ctx context.Context) ([]*model.CustomBot, error)
}

package model

import (
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"gopkg.in/guregu/null.v4"
)

type CustomBot struct {
	ID                      string
	GuildID                 common.ID
	ApplicationID           common.ID
	Token                   string
	PublicKey               string
	UserID                  common.ID
	UserName                string
	UserDiscriminator       string
	UserAvatar              null.String
	HandledFirstInteraction bool
	CreatedAt               time.Time
	TokenInvalid            bool
	GatewayStatus           string
	GatewayActivityType     null.Int
	GatewayActivityName     null.String
	GatewayActivityState    null.String
	GatewayActivityUrl      null.String
}

package store

import (
	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/events"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
)

type AppContext interface {
	ApplicationID() common.ID
	AppInviteURL() string
}

type EventDispatcher interface {
	GenericEvent() *events.GenericEvent
	DispatchEvent(event bot.Event)
}

package model

import (
	"github.com/merlinfuchs/embed-generator/embedg-service/actions"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"gopkg.in/guregu/null.v4"
)

type MessageActionSet struct {
	ID                 string
	MessageID          common.ID
	SetID              string
	Actions            actions.ActionSet
	DerivedPermissions *actions.ActionDerivedPermissions
	LastUsedAt         null.Time
	Ephemeral          bool
}

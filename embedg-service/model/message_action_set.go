package model

import (
	"encoding/json"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"gopkg.in/guregu/null.v4"
)

type MessageActionSet struct {
	ID                 string
	MessageID          common.ID
	SetID              string
	Actions            json.RawMessage
	DerivedPermissions json.RawMessage
	LastUsedAt         null.Time
	Ephemeral          bool
}

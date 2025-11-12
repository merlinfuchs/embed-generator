package model

import (
	"encoding/json"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"gopkg.in/guregu/null.v4"
)

type CustomCommand struct {
	ID                 string
	GuildID            common.ID
	Name               string
	Description        string
	Enabled            bool
	Parameters         json.RawMessage
	Actions            json.RawMessage
	CreatedAt          time.Time
	UpdatedAt          time.Time
	DeployedAt         null.Time
	DerivedPermissions json.RawMessage
	LastUsedAt         null.Time
}

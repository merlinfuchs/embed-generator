package model

import (
	"encoding/json"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"gopkg.in/guregu/null.v4"
)

type SavedMessage struct {
	ID          string
	CreatorID   common.ID
	GuildID     common.NullID
	UpdatedAt   time.Time
	Name        string
	Description null.String
	Data        json.RawMessage
}

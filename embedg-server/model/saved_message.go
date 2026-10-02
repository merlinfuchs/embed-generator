package model

import (
	"encoding/json"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
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

// SavedMessageVersion is what a saved message looked like before it was overwritten.
type SavedMessageVersion struct {
	ID             string
	SavedMessageID string
	// CreatedAt is when the version was saved, not when it was overwritten.
	CreatedAt time.Time
	Name      string
	Data      json.RawMessage
}

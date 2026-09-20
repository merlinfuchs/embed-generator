package model

import (
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"gopkg.in/guregu/null.v4"
)

type Guild struct {
	ID        common.ID
	Name      string
	Icon      null.String
	OwnerID   common.ID
	JoinedAt  time.Time
	LeftAt    null.Time
	UpdatedAt time.Time
}

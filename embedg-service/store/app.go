package store

import (
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
)

type AppContext interface {
	ApplicationID() common.ID
	AppInviteURL() string
}

package wire

import (
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"gopkg.in/guregu/null.v4"
)

type UserWire struct {
	ID            common.ID   `json:"id"`
	Name          string      `json:"name"`
	Discriminator string      `json:"discriminator"`
	Avatar        null.String `json:"avatar"`
	IsTester      bool        `json:"is_tester"`
}

type UserResponseWire APIResponse[UserWire]

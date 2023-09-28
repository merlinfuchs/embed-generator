package wire

import (
	"github.com/merlinfuchs/embed-generator/embedg-server/api/premium"
	"gopkg.in/guregu/null.v4"
)

type UserWire struct {
	ID            string                `json:"id"`
	Name          string                `json:"name"`
	Discriminator string                `json:"discriminator"`
	Avatar        null.String           `json:"avatar"`
	IsTester      bool                  `json:"is_tester"`
	PlanFeatures  *premium.PlanFeatures `json:"plan_features,omitempty"`
}

type UserResponseWire APIResponse[UserWire]

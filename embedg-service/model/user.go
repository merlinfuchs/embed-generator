package model

import (
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"gopkg.in/guregu/null.v4"
)

type User struct {
	ID            common.ID
	Name          string
	Discriminator string
	Avatar        null.String
	IsTester      bool
}

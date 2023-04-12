package wire

import "gopkg.in/guregu/null.v4"

type UserWire struct {
	ID            string      `json:"id"`
	Name          string      `json:"name"`
	Discriminator string      `json:"discriminator"`
	Avatar        null.String `json:"avatar"`
}
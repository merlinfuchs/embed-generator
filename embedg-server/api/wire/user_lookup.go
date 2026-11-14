package wire

import (
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"gopkg.in/guregu/null.v4"
)

// UserLookupWire is what Discord shows publicly about a user. The images are hashes, the app builds
// their CDN links.
type UserLookupWire struct {
	ID            common.ID   `json:"id"`
	Username      string      `json:"username"`
	Discriminator string      `json:"discriminator"`
	GlobalName    null.String `json:"global_name"`
	Avatar        null.String `json:"avatar"`
	Banner        null.String `json:"banner"`
	AccentColor   null.Int    `json:"accent_color"`
	Bot           bool        `json:"bot"`
	System        bool        `json:"system"`
	// PublicFlags are the bits behind a user's badges.
	PublicFlags int `json:"public_flags"`
}

type UserLookupResponseWire APIResponse[UserLookupWire]

package model

import (
	"encoding/json"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"gopkg.in/guregu/null.v4"
)

type EmbedLink struct {
	ID             string
	Url            string
	ThemeColor     null.String
	OgTitle        null.String
	OgSiteName     null.String
	OgDescription  null.String
	OgImage        null.String
	OeType         null.String
	OeAuthorName   null.String
	OeAuthorUrl    null.String
	OeProviderName null.String
	OeProviderUrl  null.String
	TwCard         null.String
	ComponentEmbed json.RawMessage
	ExpiresAt      null.Time
	CreatedAt      time.Time
	// UserID is who created the link, if they were logged in.
	UserID common.NullID
	// Attribution is whether the component embed ends with ComponentEmbedAttribution.
	Attribution bool
	// FlaggedAt is when the link was found to lead to a phishing site, which blocks it.
	FlaggedAt null.Time
}

package model

import (
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"gopkg.in/guregu/null.v4"
)

type EmbedLink struct {
	ID             common.ID
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
	ExpiresAt      null.Time
	CreatedAt      time.Time
}

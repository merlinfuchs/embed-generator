package wire

import (
	validation "github.com/go-ozzo/ozzo-validation/v4"
	"gopkg.in/guregu/null.v4"
)

type EmbedLinkCreateRequestWire struct {
	Url            string      `json:"url"`
	ThemeColor     null.String `json:"theme_color"`
	OgTitle        null.String `json:"og_title"`
	OgSiteName     null.String `json:"og_site_name"`
	OgDescription  null.String `json:"og_description"`
	OgImage        null.String `json:"og_image"`
	OeType         null.String `json:"oe_type"`
	OeAuthorName   null.String `json:"oe_author_name"`
	OeAuthorUrl    null.String `json:"oe_author_url"`
	OeProviderName null.String `json:"oe_provider_name"`
	OeProviderUrl  null.String `json:"oe_provider_url"`
	TwCard         null.String `json:"tw_card"`
}

func (req EmbedLinkCreateRequestWire) Validate() error {
	return validation.ValidateStruct(&req,
		validation.Field(&req.Url, validation.Required),
	)
}

type EmbedLinkCreateResponseDataWire struct {
	ID  string `json:"id"`
	URL string `json:"url"`
}

type EmbedLinkCreateResponseWire APIResponse[EmbedLinkCreateResponseDataWire]

type EmbedLinkOEmbedResponseWire struct {
	Type         string `json:"type,omitempty"`
	Title        string `json:"title,omitempty"`
	AuthorName   string `json:"author_name,omitempty"`
	AuthorUrl    string `json:"author_url,omitempty"`
	ProviderName string `json:"provider_name,omitempty"`
	ProviderUrl  string `json:"provider_url,omitempty"`
}

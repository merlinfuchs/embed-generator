package wire

// EmbedTemplateDataWire is what a dynamic embed template fills the embed with.
// Empty strings are left out of the embed.
type EmbedTemplateDataWire struct {
	Provider      string                   `json:"provider"`
	ProviderName  string                   `json:"provider_name"`
	Title         string                   `json:"title"`
	URL           string                   `json:"url"`
	Description   string                   `json:"description"`
	AuthorName    string                   `json:"author_name"`
	AuthorURL     string                   `json:"author_url"`
	AuthorIconURL string                   `json:"author_icon_url"`
	ImageURL      string                   `json:"image_url"`
	ThumbnailURL  string                   `json:"thumbnail_url"`
	Fields        []EmbedTemplateFieldWire `json:"fields"`
}

type EmbedTemplateFieldWire struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type EmbedTemplateDataResponseWire APIResponse[EmbedTemplateDataWire]

package variables

import (
	"regexp"
	"strings"

	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
)

var variableRegex = regexp.MustCompile(`\{([a-zA-Z0-9-_\.]+)\}`)

type VariableContext struct {
	providers []VariableProvider
}

func NewContext(providers ...VariableProvider) *VariableContext {
	return &VariableContext{
		providers: providers,
	}
}

func (v *VariableContext) FillString(s string) string {
	res := variableRegex.ReplaceAllStringFunc(s, func(match string) string {
		key := match[1 : len(match)-1]
		keys := strings.Split(key, ".")

		for _, provider := range v.providers {
			value := provider.Get(keys...)
			if value != nil {
				return *value
			}
		}

		return match
	})

	return res
}

func (v *VariableContext) FillMessage(m *actions.MessageWithActions) {
	m.Content = v.FillString(m.Content)
	m.Username = v.FillString(m.Username)
	m.AvatarURL = v.FillString(m.AvatarURL)

	for _, embed := range m.Embeds {
		embed.Title = v.FillString(embed.Title)
		embed.Description = v.FillString(embed.Description)
		embed.URL = v.FillString(embed.URL)

		if embed.Author != nil {
			embed.Author.Name = v.FillString(embed.Author.Name)
			embed.Author.URL = v.FillString(embed.Author.URL)
			embed.Author.IconURL = v.FillString(embed.Author.IconURL)
		}

		if embed.Footer != nil {
			embed.Footer.Text = v.FillString(embed.Footer.Text)
			embed.Footer.IconURL = v.FillString(embed.Footer.IconURL)
		}

		if embed.Image != nil {
			embed.Image.URL = v.FillString(embed.Image.URL)
		}

		if embed.Thumbnail != nil {
			embed.Thumbnail.URL = v.FillString(embed.Thumbnail.URL)
		}

		for _, field := range embed.Fields {
			field.Name = v.FillString(field.Name)
			field.Value = v.FillString(field.Value)
		}
	}
}

type VariableProvider interface {
	Get(keys ...string) *string
}

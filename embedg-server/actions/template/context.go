package template

import (
	"bytes"
	"fmt"
	"io"
	"maps"
	"strings"

	"github.com/botlabs-gg/yagpdb/v2/lib/template"
	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
)

const DefaultMaxOps = 10000
const DefaultMaxOutput = 4000

const DelimLeft = "{{"
const DelimRight = "}}"

type TemplateContext struct {
	name  string
	data  map[string]interface{}
	funcs map[string]interface{}

	MaxOps    int
	MaxOutput int64
}

func NewContext(name string, maxOps int, providers ...ContextProvider) *TemplateContext {
	data := make(map[string]interface{}, len(standardDataMap))
	maps.Copy(data, standardDataMap)

	funcs := make(map[string]interface{}, len(standardFuncMap))
	maps.Copy(funcs, standardFuncMap)

	for _, provider := range providers {
		provider.ProvideData(data)
		provider.ProvideFuncs(funcs)
	}

	if maxOps == 0 {
		maxOps = DefaultMaxOps
	}

	return &TemplateContext{
		name:  name,
		data:  data,
		funcs: funcs,

		MaxOps:    maxOps,
		MaxOutput: DefaultMaxOutput,
	}
}

func (c *TemplateContext) ParseAndExecuteMessage(m *actions.MessageWithActions) error {
	var err error

	m.Content, err = c.ParseAndExecute(m.Content)
	if err != nil {
		return err
	}
	m.Username, err = c.ParseAndExecute(m.Username)
	if err != nil {
		return err
	}
	m.AvatarURL, err = c.ParseAndExecute(m.AvatarURL)
	if err != nil {
		return err
	}

	for i := range m.Embeds {
		if err := c.parseAndExecuteEmbed(&m.Embeds[i]); err != nil {
			return err
		}
	}

	return c.parseAndExecuteComponents(m.Components)
}

// parseAndExecuteEmbed renders every templatable string of one embed in place. Everything below
// takes a pointer: ranging over the slices by value rendered a copy and threw it away, so nothing
// outside the message content ever came out templated.
func (c *TemplateContext) parseAndExecuteEmbed(embed *discord.Embed) error {
	var err error

	if embed.Title, err = c.ParseAndExecute(embed.Title); err != nil {
		return err
	}
	if embed.Description, err = c.ParseAndExecute(embed.Description); err != nil {
		return err
	}
	if embed.URL, err = c.ParseAndExecute(embed.URL); err != nil {
		return err
	}

	if embed.Author != nil {
		if embed.Author.Name, err = c.ParseAndExecute(embed.Author.Name); err != nil {
			return err
		}
		if embed.Author.URL, err = c.ParseAndExecute(embed.Author.URL); err != nil {
			return err
		}
		if embed.Author.IconURL, err = c.ParseAndExecute(embed.Author.IconURL); err != nil {
			return err
		}
	}

	if embed.Footer != nil {
		if embed.Footer.Text, err = c.ParseAndExecute(embed.Footer.Text); err != nil {
			return err
		}
		if embed.Footer.IconURL, err = c.ParseAndExecute(embed.Footer.IconURL); err != nil {
			return err
		}
	}

	if embed.Image != nil {
		if embed.Image.URL, err = c.ParseAndExecute(embed.Image.URL); err != nil {
			return err
		}
	}

	if embed.Thumbnail != nil {
		if embed.Thumbnail.URL, err = c.ParseAndExecute(embed.Thumbnail.URL); err != nil {
			return err
		}
	}

	for i := range embed.Fields {
		field := &embed.Fields[i]
		if field.Name, err = c.ParseAndExecute(field.Name); err != nil {
			return err
		}
		if field.Value, err = c.ParseAndExecute(field.Value); err != nil {
			return err
		}
	}

	return nil
}

func (c *TemplateContext) parseAndExecuteComponents(components []actions.ComponentWithActions) error {
	for i := range components {
		if err := c.parseAndExecuteComponent(&components[i]); err != nil {
			return err
		}
	}

	return nil
}

// parseAndExecuteComponent renders one component and everything nested under it. Components v2 puts
// the text of a message inside containers and sections, so this has to recurse to reach it.
func (c *TemplateContext) parseAndExecuteComponent(component *actions.ComponentWithActions) error {
	var err error

	if component.Label, err = c.ParseAndExecute(component.Label); err != nil {
		return err
	}
	if component.URL, err = c.ParseAndExecute(component.URL); err != nil {
		return err
	}
	if component.Placeholder, err = c.ParseAndExecute(component.Placeholder); err != nil {
		return err
	}
	if component.Content, err = c.ParseAndExecute(component.Content); err != nil {
		return err
	}
	if component.Description, err = c.ParseAndExecute(component.Description); err != nil {
		return err
	}

	for i := range component.Options {
		option := &component.Options[i]
		if option.Label, err = c.ParseAndExecute(option.Label); err != nil {
			return err
		}
		if option.Description, err = c.ParseAndExecute(option.Description); err != nil {
			return err
		}
	}

	for _, media := range []*actions.UnfurledMediaItem{component.Media, component.File} {
		if media == nil {
			continue
		}
		if media.URL, err = c.ParseAndExecute(media.URL); err != nil {
			return err
		}
	}

	for i := range component.Items {
		item := &component.Items[i]
		if item.Media.URL, err = c.ParseAndExecute(item.Media.URL); err != nil {
			return err
		}
		if item.Description, err = c.ParseAndExecute(item.Description); err != nil {
			return err
		}
	}

	if component.Accessory != nil {
		if err := c.parseAndExecuteComponent(component.Accessory); err != nil {
			return err
		}
	}

	return c.parseAndExecuteComponents(component.Components)
}

func (c *TemplateContext) ParseAndExecute(text string) (string, error) {
	if text == "" || !strings.Contains(text, DelimLeft) {
		return text, nil
	}

	tmpl, err := c.Parse(text)
	if err != nil {
		return "", err
	}

	return c.Execute(tmpl)
}

func (c *TemplateContext) Parse(text string) (*template.Template, error) {
	return template.New(c.name).
		Delims(DelimLeft, DelimRight).
		Funcs(c.funcs).
		Parse(text)
}

func (c *TemplateContext) Execute(tmpl *template.Template) (string, error) {
	tmpl = tmpl.MaxOps(c.MaxOps)

	var buf bytes.Buffer
	w := LimitWriter(&buf, c.MaxOutput)

	err := tmpl.Execute(w, c.data)
	if err != nil {
		if err == io.ErrShortWrite {
			err = fmt.Errorf("output exceeded %d characters", c.MaxOutput)
		}
		return "", err
	}

	res := buf.String()

	return res, nil
}

func (c *TemplateContext) Set(key string, value interface{}) {
	c.data[key] = value
}

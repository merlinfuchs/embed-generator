package template

import (
	"bytes"
	"fmt"
	"io"
	"maps"
	"strings"

	"github.com/botlabs-gg/yagpdb/v2/lib/template"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
)

const DefaultMaxOps = 10000
const DefaultMaxOutput = 25000

const DelimLeft = "{{"
const DelimRight = "}}"

type TemplateContext struct {
	name  string
	data  map[string]interface{}
	funcs map[string]interface{}

	MaxOps    int
	MaxOutput int64
}

func NewContext(name string, providers ...ContextProvider) *TemplateContext {
	data := make(map[string]interface{}, len(standardDataMap))
	maps.Copy(data, standardDataMap)

	funcs := make(map[string]interface{}, len(standardFuncMap))
	maps.Copy(funcs, standardFuncMap)

	for _, provider := range providers {
		provider.ProvideData(data)
		provider.ProvideFuncs(funcs)
	}

	return &TemplateContext{
		name:  name,
		data:  data,
		funcs: funcs,

		MaxOps:    DefaultMaxOps,
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

	for _, embed := range m.Embeds {
		embed.Title, err = c.ParseAndExecute(embed.Title)
		if err != nil {
			return err
		}
		embed.Description, err = c.ParseAndExecute(embed.Description)
		if err != nil {
			return err
		}
		embed.URL, err = c.ParseAndExecute(embed.URL)
		if err != nil {
			return err
		}

		if embed.Author != nil {
			embed.Author.Name, err = c.ParseAndExecute(embed.Author.Name)
			if err != nil {
				return err
			}
			embed.Author.URL, err = c.ParseAndExecute(embed.Author.URL)
			if err != nil {
				return err
			}
			embed.Author.IconURL, err = c.ParseAndExecute(embed.Author.IconURL)
			if err != nil {
				return err
			}
		}

		if embed.Footer != nil {
			embed.Footer.Text, err = c.ParseAndExecute(embed.Footer.Text)
			if err != nil {
				return err
			}
			embed.Footer.IconURL, err = c.ParseAndExecute(embed.Footer.IconURL)
			if err != nil {
				return err
			}
		}

		if embed.Image != nil {
			embed.Image.URL, err = c.ParseAndExecute(embed.Image.URL)
			if err != nil {
				return err
			}
		}

		if embed.Thumbnail != nil {
			embed.Thumbnail.URL, err = c.ParseAndExecute(embed.Thumbnail.URL)
			if err != nil {
				return err
			}
		}

		for _, field := range embed.Fields {
			field.Name, err = c.ParseAndExecute(field.Name)
			if err != nil {
				return err
			}
			field.Value, err = c.ParseAndExecute(field.Value)
			if err != nil {
				return err
			}
		}
	}

	return nil
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

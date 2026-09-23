package template

import (
	"strings"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions"
)

func TestParseAndExecuteMessageRendersEverything(t *testing.T) {
	tmpl := `{{ "rendered" }}`

	msg := &actions.MessageWithActions{
		Content: tmpl,
		Embeds: []discord.Embed{{
			Title:       tmpl,
			Description: tmpl,
			Fields:      []discord.EmbedField{{Name: tmpl, Value: tmpl}},
			Author:      &discord.EmbedAuthor{Name: tmpl},
		}},
		Components: []actions.ComponentWithActions{{
			Type: discord.ComponentTypeContainer,
			Components: []actions.ComponentWithActions{
				{Type: discord.ComponentTypeTextDisplay, Content: tmpl},
				{
					Type:      discord.ComponentTypeSection,
					Accessory: &actions.ComponentWithActions{Type: discord.ComponentTypeButton, Label: tmpl},
				},
				{
					Type:    discord.ComponentTypeStringSelectMenu,
					Options: []actions.ComponentSelectOptionWithActions{{Label: tmpl, Description: tmpl}},
				},
			},
		}},
	}

	c := NewContext("TEST", 0)
	if err := c.ParseAndExecuteMessage(msg); err != nil {
		t.Fatal(err)
	}

	embed := msg.Embeds[0]
	container := msg.Components[0]

	for name, got := range map[string]string{
		"content":            msg.Content,
		"embed title":        embed.Title,
		"embed description":  embed.Description,
		"embed field name":   embed.Fields[0].Name,
		"embed field value":  embed.Fields[0].Value,
		"embed author name":  embed.Author.Name,
		"text display":       container.Components[0].Content,
		"section accessory":  container.Components[1].Accessory.Label,
		"select option":      container.Components[2].Options[0].Label,
		"select option desc": container.Components[2].Options[0].Description,
	} {
		if got != "rendered" {
			t.Errorf("%s = %q, want %q", name, got, "rendered")
		}
	}
}

// A template that doubles a string a few dozen times used to allocate until the process died.
func TestPrintfIsBounded(t *testing.T) {
	c := NewContext("TEST", 0)

	_, err := c.ParseAndExecute(`{{$s := "aaaaaaaa"}}{{range seq 0 40}}{{$s = printf "%s%s" $s $s}}{{end}}`)
	if err == nil {
		t.Fatal("doubling a string 40 times was allowed")
	}
	if !strings.Contains(err.Error(), "too long") {
		t.Fatalf("failed with %v, want a length error", err)
	}
}

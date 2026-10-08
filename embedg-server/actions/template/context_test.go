package template

import (
	"strings"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
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

func TestDiscordTimestamp(t *testing.T) {
	c := NewContext("TEST", 0)

	for tmpl, want := range map[string]string{
		`{{ discordTimestamp (newDate 2026 10 2 0 0 0) "D" }}`: "<t:1790899200:D>",
		`{{ discordTimestamp 1790899200 "R" }}`:                "<t:1790899200:R>",
		`{{ discordTimestamp "1790899200" }}`:                  "<t:1790899200>",
	} {
		got, err := c.ParseAndExecute(tmpl)
		if err != nil {
			t.Errorf("%s failed: %v", tmpl, err)
		} else if got != want {
			t.Errorf("%s = %q, want %q", tmpl, got, want)
		}
	}

	for _, tmpl := range []string{
		`{{ discordTimestamp currentTime "x" }}`,
		`{{ discordTimestamp "tomorrow" }}`,
		`{{ discordTimestamp currentTime "D" "R" }}`,
	} {
		if _, err := c.ParseAndExecute(tmpl); err == nil {
			t.Errorf("%s was allowed", tmpl)
		}
	}
}

func TestCheckMessageDoesNotRun(t *testing.T) {
	ran := false
	c := NewContext("TEST", 0)
	c.funcs["mark"] = func() string { ran = true; return "" }

	ok := &actions.MessageWithActions{Content: "{{mark}}"}
	if err := c.CheckMessage(ok); err != nil {
		t.Fatal(err)
	}
	if ran || ok.Content != "{{mark}}" {
		t.Errorf("want the template parsed but not run, ran %v, content %q", ran, ok.Content)
	}

	broken := &actions.MessageWithActions{Content: "{{mark"}
	if err := c.CheckMessage(broken); err == nil {
		t.Error("want a template that doesn't parse to fail")
	}
}

package actions

import (
	"errors"
	"fmt"
	"unicode/utf8"

	"github.com/disgoorg/disgo/discord"
)

// Discord's limits on a message. A response message that an action carries itself is checked
// against them when it's saved, as Discord only sees it once the action runs.
const (
	maxContentLength      = 2000
	maxEmbeds             = 10
	maxEmbedsTextLength   = 6000
	maxTextDisplaysLength = 4000
	maxEmbedFields        = 25
	maxRows               = 5
	maxButtonsPerRow      = 5
	maxComponentsV2       = 40
)

// CheckResponseMessage checks a message that an action responds with itself instead of naming a
// saved message. It can't have buttons with actions or select menus of its own, responses that
// lead on to more responses go through saved messages.
func CheckResponseMessage(m *MessageWithActions) error {
	for _, set := range m.Actions {
		if len(set.Actions) != 0 {
			return errors.New("it can't have actions of its own")
		}
	}
	if hasInteractive(m.Components) {
		return errors.New("it can only have link buttons, not buttons with actions or select menus")
	}

	if m.ComponentsV2Enabled() {
		if m.Content != "" || len(m.Embeds) != 0 {
			return errors.New("it uses Components V2, which can't have content or embeds")
		}
		if len(m.Components) == 0 {
			return errors.New("it uses Components V2 but has no components")
		}
		if n := componentCount(m.Components); n > maxComponentsV2 {
			return fmt.Errorf("it has %d components, more than %d", n, maxComponentsV2)
		}
		if n := textDisplaysLength(m.Components); n > maxTextDisplaysLength {
			return fmt.Errorf("its text displays have %d characters together, more than %d", n, maxTextDisplaysLength)
		}
		return nil
	}

	if len(m.Components) > maxRows {
		return fmt.Errorf("it has %d rows of buttons, more than %d", len(m.Components), maxRows)
	}
	for i, row := range m.Components {
		if row.Type != discord.ComponentTypeActionRow {
			return errors.New("only Components V2 messages can have components outside of button rows")
		}
		if len(row.Components) > maxButtonsPerRow {
			return fmt.Errorf("row %d has %d buttons, more than %d", i+1, len(row.Components), maxButtonsPerRow)
		}
	}

	if m.Content == "" && len(m.Embeds) == 0 && len(m.Components) == 0 {
		return errors.New("it's empty")
	}
	if err := checkLength("its content", m.Content, maxContentLength); err != nil {
		return err
	}
	if len(m.Embeds) > maxEmbeds {
		return fmt.Errorf("it has %d embeds, more than %d", len(m.Embeds), maxEmbeds)
	}

	total := 0
	for i, embed := range m.Embeds {
		n, err := embedTextLength(embed)
		if err != nil {
			return fmt.Errorf("embed %d: %w", i+1, err)
		}
		total += n
	}
	if total > maxEmbedsTextLength {
		return fmt.Errorf("its embeds have %d characters together, more than %d", total, maxEmbedsTextLength)
	}
	return nil
}

type limitedText struct {
	what  string
	value string
	max   int
}

// embedTextLength is how much of the text limit across all embeds the embed takes, after checking
// the limits of its own fields.
func embedTextLength(e discord.Embed) (int, error) {
	if len(e.Fields) > maxEmbedFields {
		return 0, fmt.Errorf("it has %d fields, more than %d", len(e.Fields), maxEmbedFields)
	}

	texts := []limitedText{
		{"the title", e.Title, 256},
		{"the description", e.Description, 4096},
	}
	if e.Author != nil {
		texts = append(texts, limitedText{"the author name", e.Author.Name, 256})
	}
	if e.Footer != nil {
		texts = append(texts, limitedText{"the footer text", e.Footer.Text, 2048})
	}
	for i, field := range e.Fields {
		texts = append(texts,
			limitedText{fmt.Sprintf("the name of field %d", i+1), field.Name, 256},
			limitedText{fmt.Sprintf("the value of field %d", i+1), field.Value, 1024},
		)
	}

	total := 0
	for _, t := range texts {
		if err := checkLength(t.what, t.value, t.max); err != nil {
			return 0, err
		}
		total += utf8.RuneCountInString(t.value)
	}
	return total, nil
}

func checkLength(what, s string, max int) error {
	if n := utf8.RuneCountInString(s); n > max {
		return fmt.Errorf("%s has %d characters, more than %d", what, n, max)
	}
	return nil
}

func hasInteractive(components []ComponentWithActions) bool {
	for _, c := range components {
		if c.Interactive() || hasInteractive(c.Components) {
			return true
		}
		if c.Accessory != nil && c.Accessory.Interactive() {
			return true
		}
	}
	return false
}

func componentCount(components []ComponentWithActions) int {
	n := len(components)
	for _, c := range components {
		n += componentCount(c.Components)
		if c.Accessory != nil {
			n++
		}
	}
	return n
}

func textDisplaysLength(components []ComponentWithActions) int {
	n := 0
	for _, c := range components {
		if c.Type == discord.ComponentTypeTextDisplay {
			n += utf8.RuneCountInString(c.Content)
		}
		n += textDisplaysLength(c.Components)
	}
	return n
}

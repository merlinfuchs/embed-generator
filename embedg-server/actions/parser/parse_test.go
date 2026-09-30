package parser

import (
	"errors"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
)

func TestParseMessageComponentsWithoutInteractive(t *testing.T) {
	link := actions.ComponentWithActions{Type: discord.ComponentTypeButton, Style: discord.ButtonStyleLink, Label: "Rules", URL: "https://example.com"}
	action := actions.ComponentWithActions{Type: discord.ComponentTypeButton, Style: discord.ButtonStylePrimary, Label: "Role", ActionSetID: "a"}
	selectMenu := actions.ComponentWithActions{Type: discord.ComponentTypeStringSelectMenu}
	text := actions.ComponentWithActions{Type: discord.ComponentTypeTextDisplay, Content: "Hi"}

	row := func(c actions.ComponentWithActions) actions.ComponentWithActions {
		return actions.ComponentWithActions{Type: discord.ComponentTypeActionRow, Components: []actions.ComponentWithActions{c}}
	}
	section := func(accessory actions.ComponentWithActions) actions.ComponentWithActions {
		return actions.ComponentWithActions{Type: discord.ComponentTypeSection, Components: []actions.ComponentWithActions{text}, Accessory: &accessory}
	}
	container := func(c actions.ComponentWithActions) actions.ComponentWithActions {
		return actions.ComponentWithActions{Type: discord.ComponentTypeContainer, Components: []actions.ComponentWithActions{c}}
	}

	tests := []struct {
		name      string
		component actions.ComponentWithActions
		ok        bool
	}{
		{"link button", row(link), true},
		{"text in a container", container(text), true},
		{"link button beside a section", container(section(link)), true},
		{"button with actions", row(action), false},
		{"select menu", row(selectMenu), false},
		{"button with actions beside a section", container(section(action)), false},
	}

	m := &ActionParser{}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, err := m.ParseMessageComponents([]actions.ComponentWithActions{test.component}, false)
			if test.ok && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !test.ok && !errors.Is(err, ErrInteractiveNotAllowed) {
				t.Fatalf("err = %v, want ErrInteractiveNotAllowed", err)
			}
		})
	}

	if _, err := m.ParseMessageComponents([]actions.ComponentWithActions{row(action)}, true); err != nil {
		t.Fatalf("with the bot: %v", err)
	}
}

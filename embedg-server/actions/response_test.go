package actions

import (
	"strings"
	"testing"

	"github.com/disgoorg/disgo/discord"
)

func TestCheckResponseMessage(t *testing.T) {
	linkRow := ComponentWithActions{
		Type:       discord.ComponentTypeActionRow,
		Components: []ComponentWithActions{{Type: discord.ComponentTypeButton, Style: discord.ButtonStyleLink, URL: "https://message.style"}},
	}
	actionRow := ComponentWithActions{
		Type:       discord.ComponentTypeActionRow,
		Components: []ComponentWithActions{{Type: discord.ComponentTypeButton, Style: discord.ButtonStylePrimary, ActionSetID: "a"}},
	}
	v2 := discord.MessageFlagIsComponentsV2

	tests := []struct {
		name string
		msg  MessageWithActions
		ok   bool
	}{
		{name: "content", msg: MessageWithActions{Content: "hi"}, ok: true},
		{name: "embed and link button", msg: MessageWithActions{Embeds: []discord.Embed{{Title: "hi"}}, Components: []ComponentWithActions{linkRow}}, ok: true},
		{name: "empty", msg: MessageWithActions{}},
		{name: "content too long", msg: MessageWithActions{Content: strings.Repeat("a", 2001)}},
		{name: "content at the limit in runes", msg: MessageWithActions{Content: strings.Repeat("ä", 2000)}, ok: true},
		{name: "too many embeds", msg: MessageWithActions{Embeds: make([]discord.Embed, 11)}},
		{name: "title too long", msg: MessageWithActions{Embeds: []discord.Embed{{Title: strings.Repeat("a", 257)}}}},
		{
			name: "embeds too long together",
			msg: MessageWithActions{Embeds: []discord.Embed{
				{Description: strings.Repeat("a", 4000)},
				{Description: strings.Repeat("a", 2001)},
			}},
		},
		{name: "button with actions", msg: MessageWithActions{Content: "hi", Components: []ComponentWithActions{actionRow}}},
		{
			name: "button with actions in a section",
			msg: MessageWithActions{Flags: v2, Components: []ComponentWithActions{{
				Type:       discord.ComponentTypeContainer,
				Components: []ComponentWithActions{{Type: discord.ComponentTypeSection, Accessory: &actionRow.Components[0]}},
			}}},
		},
		{name: "actions of its own", msg: MessageWithActions{Content: "hi", Actions: map[string]ActionSet{"a": {Actions: []Action{{Type: ActionTypeTextResponse}}}}}},
		{name: "empty action sets of link buttons", msg: MessageWithActions{Content: "hi", Actions: map[string]ActionSet{"a": {}}}, ok: true},
		{name: "too many rows", msg: MessageWithActions{Content: "hi", Components: []ComponentWithActions{linkRow, linkRow, linkRow, linkRow, linkRow, linkRow}}},
		{name: "text display without components v2", msg: MessageWithActions{Components: []ComponentWithActions{{Type: discord.ComponentTypeTextDisplay, Content: "hi"}}}},
		{name: "components v2", msg: MessageWithActions{Flags: v2, Components: []ComponentWithActions{{Type: discord.ComponentTypeTextDisplay, Content: "hi"}}}, ok: true},
		{name: "components v2 with content", msg: MessageWithActions{Flags: v2, Content: "hi", Components: []ComponentWithActions{{Type: discord.ComponentTypeTextDisplay, Content: "hi"}}}},
		{name: "components v2 without components", msg: MessageWithActions{Flags: v2}},
		{
			name: "text displays too long",
			msg: MessageWithActions{Flags: v2, Components: []ComponentWithActions{
				{Type: discord.ComponentTypeTextDisplay, Content: strings.Repeat("a", 3000)},
				{Type: discord.ComponentTypeContainer, Components: []ComponentWithActions{{Type: discord.ComponentTypeTextDisplay, Content: strings.Repeat("a", 1001)}}},
			}},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := CheckResponseMessage(&tt.msg)
			if (err == nil) != tt.ok {
				t.Fatalf("want ok=%v, got %v", tt.ok, err)
			}
		})
	}
}

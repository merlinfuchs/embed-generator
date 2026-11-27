package parser

import (
	"encoding/json"
	"errors"
	"reflect"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
)

func TestEntitySelectRoundTrip(t *testing.T) {
	types := []discord.ComponentType{
		discord.ComponentTypeUserSelectMenu,
		discord.ComponentTypeRoleSelectMenu,
		discord.ComponentTypeMentionableSelectMenu,
		discord.ComponentTypeChannelSelectMenu,
	}
	m := &ActionParser{}

	for _, typ := range types {
		for _, reset := range []bool{false, true} {
			minValues := 0
			component := actions.ComponentWithActions{
				Type:           typ,
				Placeholder:    "Pick",
				MinValues:      &minValues,
				MaxValues:      3,
				Disabled:       true,
				ActionSetID:    "set",
				ResetSelection: reset,
			}
			row := []actions.ComponentWithActions{{Type: discord.ComponentTypeActionRow, Components: []actions.ComponentWithActions{component}}}

			if _, err := m.ParseMessageComponents(row, false); !errors.Is(err, ErrInteractiveNotAllowed) {
				t.Fatalf("type %d without the bot: err = %v", typ, err)
			}

			parsed, err := m.ParseMessageComponents(row, true)
			if err != nil {
				t.Fatalf("type %d: %v", typ, err)
			}

			// Through JSON, the way a message comes back from Discord.
			raw, err := json.Marshal(parsed[0])
			if err != nil {
				t.Fatal(err)
			}
			var back discord.ActionRowComponent
			if err := json.Unmarshal(raw, &back); err != nil {
				t.Fatal(err)
			}
			res, err := m.UnparseMessageComponents([]discord.LayoutComponent{back})
			if err != nil {
				t.Fatalf("type %d: %v", typ, err)
			}
			if got := res[0].Components[0]; !reflect.DeepEqual(got, component) {
				t.Fatalf("type %d: got %+v, want %+v, sent %s", typ, got, component, raw)
			}
		}
	}
}

func TestUnparseResetEntitySelect(t *testing.T) {
	res := unparseEntitySelect(discord.ComponentTypeUserSelectMenu, "action:entities:reset@abc:set", "", nil, 0, false)
	if res.ActionSetID != "set" || !res.ResetSelection {
		t.Fatalf("got %+v", res)
	}
}

package handler

import (
	"context"
	"fmt"
	"strings"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

// templatePlanStore allows enough template operations to render variables.
type templatePlanStore struct {
	store.PlanStore
}

func (templatePlanStore) GetPlanFeaturesForGuild(context.Context, common.ID) (model.PlanFeatures, error) {
	return model.PlanFeatures{MaxTemplateOps: 1000}, nil
}

// recordingActionSetStore remembers which action set was looked up.
type recordingActionSetStore struct {
	store.MessageActionSetStore
	set   actions.ActionSet
	setID string
}

func (s *recordingActionSetStore) GetMessageActionSet(_ context.Context, _ common.ID, setID string) (*model.MessageActionSet, error) {
	s.setID = setID
	return &model.MessageActionSet{Actions: s.set}, nil
}

func entitySelectInteraction(t *testing.T, componentType int, customID, data string) discord.Interaction {
	return mustInteraction(t, fmt.Sprintf(`{"id":"1","application_id":"2","type":3,"token":"t","version":1,
		"guild_id":"6","channel":{"id":"4","type":0,"guild_id":"6","name":"c"},"member":{"user":{"id":"7","username":"u"},"roles":[],"permissions":"0"},
		"data":{"component_type":%[1]d,"custom_id":"%[2]s",%[3]s},
		"message":{"id":"3","channel_id":"4","components":[{"type":1,"components":[{"type":%[1]d,"custom_id":"%[2]s"}]}]}}`,
		componentType, customID, data))
}

func TestEntitySelectVariables(t *testing.T) {
	tests := []struct {
		name          string
		componentType int
		data          string
		want          string
	}{
		{"users", 5, `"values":["11","12"]`, "<@11> <@12>|11 12"},
		{"roles", 6, `"values":["13"]`, "<@&13>|13"},
		{"mentionables", 7, `"values":["11","13"],"resolved":{"roles":{"13":{"id":"13","name":"r"}}}`, "<@11> <@&13>|11 13"},
		{"channels", 8, `"values":["14"]`, "<#14>|14"},
	}
	for _, tt := range tests {
		for _, customID := range []string{"action:entities:a", "action:entities:reset:a", "action:entities:reset@xyz:a"} {
			t.Run(tt.name+" "+customID, func(t *testing.T) {
				reply := actions.Action{Type: actions.ActionTypeTextResponse, Text: "{{.Selected}}|{{.SelectedIDs}}"}
				sets := &recordingActionSetStore{set: actions.ActionSet{Actions: []actions.Action{reply}}}
				h := &ActionHandler{actionSetStore: sets, planStore: templatePlanStore{}}
				i, f := newTestInteraction(entitySelectInteraction(t, tt.componentType, customID, tt.data))

				if err := h.HandleActionInteraction(f, i); err != nil {
					t.Fatal(err)
				}
				if sets.setID != "a" {
					t.Fatalf("looked up action set %q, want a", sets.setID)
				}

				// A reset sends the components back first, which makes the reply a followup.
				var content string
				if strings.Contains(customID, "reset") {
					if len(f.followups) != 1 {
						t.Fatalf("want one followup, got %+v", f.followups)
					}
					content = f.followups[0].Content
				} else {
					if len(f.initial) != 1 {
						t.Fatalf("want one response, got %+v", f.initial)
					}
					msg, _ := f.initial[0].Data.(discord.MessageCreate)
					content = msg.Content
				}
				if content != tt.want {
					t.Fatalf("content = %q, want %q", content, tt.want)
				}
			})
		}
	}
}

func TestEntitySelectNothingPicked(t *testing.T) {
	h := &ActionHandler{actionSetStore: missingActionSetStore{}}
	i, f := newTestInteraction(entitySelectInteraction(t, 5, "action:entities:a", `"values":[]`))

	if err := h.HandleActionInteraction(f, i); err != nil {
		t.Fatal(err)
	}
	if len(f.initial) != 1 || f.initial[0].Type != discord.InteractionResponseTypeDeferredUpdateMessage {
		t.Fatalf("want a deferred update, got %+v", f.initial)
	}
}

// Discord keeps showing the picks unless the select comes back with another custom ID.
func TestEntitySelectResetChangesCustomID(t *testing.T) {
	sets := []struct {
		name   string
		action actions.Action
	}{
		{"reply", actions.Action{Type: actions.ActionTypeTextResponse, Text: "hi"}},
		{"edit", actions.Action{Type: actions.ActionTypeTextEdit, Text: "edited"}},
	}
	for _, tt := range sets {
		t.Run(tt.name, func(t *testing.T) {
			h := &ActionHandler{actionSetStore: actionSetStore{set: actions.ActionSet{Actions: []actions.Action{tt.action}}}, planStore: templatePlanStore{}}
			i, f := newTestInteraction(mustInteraction(t, `{"id":"1","application_id":"2","type":3,"token":"t","version":1,
				"guild_id":"6","channel":{"id":"4","type":0,"guild_id":"6","name":"c"},"member":{"user":{"id":"7","username":"u"},"roles":[],"permissions":"0"},
				"data":{"component_type":5,"custom_id":"action:entities:reset:a","values":["11"]},
				"message":{"id":"3","channel_id":"4","components":[{"type":17,"components":[
					{"type":1,"components":[{"type":5,"custom_id":"action:entities:reset:a"}]},
					{"type":1,"components":[{"type":6,"custom_id":"action:entities:reset:b"}]}]}]}}`))

			if err := h.HandleActionInteraction(f, i); err != nil {
				t.Fatal(err)
			}
			if len(f.initial) != 1 {
				t.Fatalf("want one initial response, got %+v", f.initial)
			}
			update, ok := f.initial[0].Data.(discord.MessageUpdate)
			if !ok || update.Components == nil {
				t.Fatalf("want the components back, got %+v", f.initial[0])
			}

			container := (*update.Components)[0].(discord.ContainerComponent)
			picked := container.Components[0].(discord.ActionRowComponent).Components[0].(discord.UserSelectMenuComponent)
			other := container.Components[1].(discord.ActionRowComponent).Components[0].(discord.RoleSelectMenuComponent)

			// The ID of the interaction is the nonce.
			if picked.CustomID != "action:entities:reset@1:a" {
				t.Fatalf("picked select has custom ID %q", picked.CustomID)
			}
			if other.CustomID != "action:entities:reset:b" {
				t.Fatalf("the other select changed to %q", other.CustomID)
			}
		})
	}
}

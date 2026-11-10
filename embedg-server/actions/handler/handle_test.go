package handler

import (
	"context"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

type missingActionSetStore struct {
	store.MessageActionSetStore
}

func (missingActionSetStore) GetMessageActionSet(context.Context, common.ID, string) (*model.MessageActionSet, error) {
	return nil, store.ErrNotFound
}

// Without a response Discord tells the user the bot didn't respond in time.
func TestInteractionWithoutActionsResponds(t *testing.T) {
	tests := []struct {
		name        string
		interaction func(t *testing.T) discord.Interaction
		want        discord.InteractionResponseType
		// wantContent is the ephemeral message expected, if any.
		wantContent string
	}{
		{
			name:        "missing action set",
			interaction: componentInteraction,
			want:        discord.InteractionResponseTypeCreateMessage,
			wantContent: noActionsMessage,
		},
		{
			name: "missing action set of a select option",
			interaction: func(t *testing.T) discord.Interaction {
				return componentInteractionWithData(t, `{"component_type":3,"custom_id":"action:options:a","values":["action:b"]}`)
			},
			want:        discord.InteractionResponseTypeCreateMessage,
			wantContent: noActionsMessage,
		},
		{
			name: "nothing selected",
			interaction: func(t *testing.T) discord.Interaction {
				return componentInteractionWithData(t, `{"component_type":3,"custom_id":"action:options:a","values":[]}`)
			},
			want: discord.InteractionResponseTypeDeferredUpdateMessage,
		},
		{
			name: "component in a DM",
			interaction: func(t *testing.T) discord.Interaction {
				return mustInteraction(t, `{"id":"1","application_id":"2","type":3,"token":"t","version":1,
					"data":{"component_type":2,"custom_id":"action:a"},"message":{"id":"3","channel_id":"4"}}`)
			},
			want: discord.InteractionResponseTypeDeferredUpdateMessage,
		},
		{
			name:        "command outside of a server",
			interaction: commandInteraction,
			want:        discord.InteractionResponseTypeCreateMessage,
			wantContent: "No response",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &ActionHandler{actionSetStore: missingActionSetStore{}}
			i, f := newTestInteraction(tt.interaction(t))

			if err := h.HandleActionInteraction(f, i); err != nil {
				t.Fatal(err)
			}
			if len(f.initial) != 1 || f.initial[0].Type != tt.want {
				t.Fatalf("want one %d response, got %+v", tt.want, f.initial)
			}
			if tt.wantContent == "" {
				return
			}
			msg, _ := f.initial[0].Data.(discord.MessageCreate)
			if msg.Content != tt.wantContent || !msg.Flags.Has(discord.MessageFlagEphemeral) {
				t.Fatalf("want ephemeral %q, got %+v", tt.wantContent, msg)
			}
		})
	}
}

type actionSetStore struct {
	store.MessageActionSetStore
	set actions.ActionSet
}

func (s actionSetStore) GetMessageActionSet(context.Context, common.ID, string) (*model.MessageActionSet, error) {
	return &model.MessageActionSet{Actions: s.set}, nil
}

type freePlanStore struct {
	store.PlanStore
}

func (freePlanStore) GetPlanFeaturesForGuild(context.Context, common.ID) (model.PlanFeatures, error) {
	return model.PlanFeatures{}, nil
}

func TestSelectMenuReset(t *testing.T) {
	reply := actions.Action{Type: actions.ActionTypeTextResponse, Text: "hi"}
	edit := actions.Action{Type: actions.ActionTypeTextEdit, Text: "edited"}

	tests := []struct {
		name     string
		customID string
		set      actions.ActionSet
		// wantReset is whether the components go back as the initial response, with the reply as a
		// followup.
		wantReset bool
	}{
		{"reset", "action:options:reset:a", actions.ActionSet{Actions: []actions.Action{reply}}, true},
		{"no reset", "action:options:a", actions.ActionSet{Actions: []actions.Action{reply}}, false},
		{"reset with an edit", "action:options:reset:a", actions.ActionSet{Actions: []actions.Action{edit}}, false},
		{"reset with an edit after a reply", "action:options:reset:a", actions.ActionSet{Actions: []actions.Action{reply, edit}}, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &ActionHandler{actionSetStore: actionSetStore{set: tt.set}, planStore: freePlanStore{}}
			i, f := newTestInteraction(mustInteraction(t, `{"id":"1","application_id":"2","type":3,"token":"t","version":1,
				"guild_id":"6","channel":{"id":"4","type":0,"guild_id":"6","name":"c"},"member":{"user":{"id":"7","username":"u"},"roles":[],"permissions":"0"},
				"data":{"component_type":3,"custom_id":"`+tt.customID+`","values":["action:b"]},
				"message":{"id":"3","channel_id":"4","components":[{"type":1,"components":[
					{"type":3,"custom_id":"`+tt.customID+`","options":[{"label":"B","value":"action:b"}]}]}]}}`))

			if err := h.HandleActionInteraction(f, i); err != nil {
				t.Fatal(err)
			}
			if len(f.initial) != 1 {
				t.Fatalf("want one initial response, got %+v", f.initial)
			}

			update, isUpdate := f.initial[0].Data.(discord.MessageUpdate)
			reset := isUpdate && update.Components != nil
			if reset != tt.wantReset {
				t.Fatalf("want reset %v, got %+v", tt.wantReset, f.initial[0])
			}
			if !tt.wantReset {
				return
			}
			if f.initial[0].Type != discord.InteractionResponseTypeUpdateMessage || len(*update.Components) != 1 {
				t.Fatalf("want the message's components back, got %+v", f.initial[0])
			}
			if len(f.followups) != 1 || f.followups[0].Content != "hi" {
				t.Fatalf("want the reply as a followup, got %+v", f.followups)
			}
			// After the reset, an edit goes to the original response, which is the select's message.
			for _, e := range f.edits {
				if e.Content == nil || *e.Content != "edited" {
					t.Fatalf("want the edit of the select's message, got %+v", e)
				}
			}
		})
	}
}

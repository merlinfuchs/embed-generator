package handler

import (
	"context"
	"testing"

	"github.com/disgoorg/disgo/discord"
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

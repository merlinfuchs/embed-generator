package handler

import (
	"context"
	"testing"
	"time"

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
func TestComponentWithoutActionsResponds(t *testing.T) {
	tests := []struct {
		name string
		data string
		want discord.InteractionResponseType
	}{
		{
			name: "missing action set",
			data: `{"component_type":2,"custom_id":"action:a"}`,
			want: discord.InteractionResponseTypeCreateMessage,
		},
		{
			name: "missing action set of a select option",
			data: `{"component_type":3,"custom_id":"action:options:a","values":["action:b"]}`,
			want: discord.InteractionResponseTypeCreateMessage,
		},
		{
			name: "nothing selected",
			data: `{"component_type":3,"custom_id":"action:options:a","values":[]}`,
			want: discord.InteractionResponseTypeDeferredUpdateMessage,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &ActionHandler{actionSetStore: missingActionSetStore{}}
			i, f := newTestInteraction(mustInteraction(t, `{"id":"1","application_id":"2","type":3,"token":"t","version":1,
				"data":`+tt.data+`,"message":{"id":"3","channel_id":"4"}}`))
			i.timer = time.NewTimer(time.Hour)

			if err := h.HandleActionInteraction(f, i); err != nil {
				t.Fatal(err)
			}
			if len(f.initial) != 1 || f.initial[0].Type != tt.want {
				t.Fatalf("want one %d response, got %+v", tt.want, f.initial)
			}
		})
	}
}

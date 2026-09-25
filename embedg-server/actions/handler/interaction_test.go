package handler

import (
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/snowflake/v2"
)

type fakeRest struct {
	rest.Rest

	followups []discord.MessageCreate
	edits     []discord.MessageUpdate
}

func (f *fakeRest) CreateFollowupMessage(_ snowflake.ID, _ string, msg discord.MessageCreate, _ ...rest.RequestOpt) (*discord.Message, error) {
	f.followups = append(f.followups, msg)
	return &discord.Message{ID: snowflake.ID(len(f.followups))}, nil
}

func (f *fakeRest) UpdateInteractionResponse(_ snowflake.ID, _ string, msg discord.MessageUpdate, _ ...rest.RequestOpt) (*discord.Message, error) {
	f.edits = append(f.edits, msg)
	return &discord.Message{}, nil
}

func mustInteraction(t *testing.T, raw string) discord.Interaction {
	t.Helper()
	i, err := discord.UnmarshalInteraction([]byte(raw))
	if err != nil {
		t.Fatal(err)
	}
	return i
}

func componentInteraction(t *testing.T) discord.Interaction {
	return mustInteraction(t, `{"id":"1","application_id":"2","type":3,"token":"t","version":1,
		"data":{"component_type":2,"custom_id":"action:a"},
		"message":{"id":"3","channel_id":"4"}}`)
}

func commandInteraction(t *testing.T) discord.Interaction {
	return mustInteraction(t, `{"id":"1","application_id":"2","type":2,"token":"t","version":1,
		"data":{"id":"5","name":"cmd","type":1}}`)
}

// newTestInteraction doesn't start the timer, the tests defer by calling autoDefer themselves.
func newTestInteraction(inner discord.Interaction) (*restInteraction, *fakeRest, *[]discord.InteractionResponse) {
	f := &fakeRest{}
	var initial []discord.InteractionResponse
	i := &restInteraction{inner: inner, rest: f, initial: func(resp discord.InteractionResponse) error {
		initial = append(initial, resp)
		return nil
	}}
	return i, f, &initial
}

func TestRespondInTime(t *testing.T) {
	i, f, initial := newTestInteraction(componentInteraction(t))

	i.Respond(discord.MessageCreate{Content: "hi"})
	i.autoDefer()

	if len(*initial) != 1 || (*initial)[0].Type != discord.InteractionResponseTypeCreateMessage {
		t.Fatalf("want the response as the only initial response, got %+v", *initial)
	}
	if len(f.followups) != 0 {
		t.Fatalf("want no followups, got %d", len(f.followups))
	}
}

func TestSlowComponentResponseIsFollowup(t *testing.T) {
	i, f, initial := newTestInteraction(componentInteraction(t))

	i.autoDefer()
	if i.HasResponded() {
		t.Fatal("the automatic defer must not count as the handler's response")
	}
	i.Respond(discord.MessageCreate{Content: "slow"})

	if len(*initial) != 1 || (*initial)[0].Type != discord.InteractionResponseTypeDeferredUpdateMessage {
		t.Fatalf("want a deferred update, got %+v", *initial)
	}
	if len(f.followups) != 1 || f.followups[0].Content != "slow" {
		t.Fatalf("want the response as a followup, got %+v", f.followups)
	}
	if !i.HasResponded() {
		t.Fatal("want the followup to count as responded")
	}
}

func TestSlowComponentEditsItsMessage(t *testing.T) {
	i, f, _ := newTestInteraction(componentInteraction(t))

	i.autoDefer()
	content := "edited"
	i.Respond(discord.MessageUpdate{Content: &content}, discord.InteractionResponseTypeUpdateMessage)

	if len(f.edits) != 1 {
		t.Fatalf("want the update as an edit of the original response, got %d edits", len(f.edits))
	}
}

func TestDeferAfterAutoDeferIsNoop(t *testing.T) {
	i, f, initial := newTestInteraction(componentInteraction(t))

	i.autoDefer()
	i.Respond(discord.MessageCreate{}, discord.InteractionResponseTypeDeferredCreateMessage)
	msg := i.Respond(discord.MessageCreate{Content: "saved"})

	if len(*initial) != 1 {
		t.Fatalf("want only the automatic defer, got %+v", *initial)
	}
	if msg == nil || len(f.followups) != 1 {
		t.Fatalf("want the saved message as a followup with its message returned, got %v and %+v", msg, f.followups)
	}
}

func TestSlowCommandDefersEphemeral(t *testing.T) {
	i, f, initial := newTestInteraction(commandInteraction(t))

	i.autoDefer()
	i.Respond(discord.MessageCreate{Content: "No response", Flags: discord.MessageFlagEphemeral})

	resp := (*initial)[0]
	data, _ := resp.Data.(discord.MessageCreate)
	if resp.Type != discord.InteractionResponseTypeDeferredCreateMessage || !data.Flags.Has(discord.MessageFlagEphemeral) {
		t.Fatalf("want an ephemeral deferred message, got %+v", resp)
	}
	if len(f.followups) != 1 {
		t.Fatalf("want the response as a followup, got %d", len(f.followups))
	}
}

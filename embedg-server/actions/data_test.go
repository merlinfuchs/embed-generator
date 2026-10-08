package actions

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
)

func TestMessageWithActionsEmbedTimestamp(t *testing.T) {
	var m MessageWithActions
	err := json.Unmarshal([]byte(`{
		"content": "hi",
		"embeds": [
			{"title": "empty", "timestamp": ""},
			{"title": "missing"},
			{"title": "set", "timestamp": "2026-10-07T12:00:00.000Z"}
		]
	}`), &m)
	if err != nil {
		t.Fatal(err)
	}

	if m.Content != "hi" || len(m.Embeds) != 3 {
		t.Fatalf("got content %q and %d embeds", m.Content, len(m.Embeds))
	}
	if m.Embeds[0].Title != "empty" || m.Embeds[0].Timestamp != nil {
		t.Errorf("empty timestamp: got %+v", m.Embeds[0])
	}
	if m.Embeds[1].Timestamp != nil {
		t.Errorf("missing timestamp: got %v", m.Embeds[1].Timestamp)
	}
	want := time.Date(2026, 10, 7, 12, 0, 0, 0, time.UTC)
	if m.Embeds[2].Timestamp == nil || !m.Embeds[2].Timestamp.Equal(want) {
		t.Errorf("timestamp = %v, want %v", m.Embeds[2].Timestamp, want)
	}

	err = json.Unmarshal([]byte(`{"embeds": [{"title": "a"}, {"timestamp": "tomorrow"}]}`), &m)
	if err == nil || err.Error() != `embed 2 has an invalid timestamp "tomorrow"` {
		t.Errorf("invalid timestamp: err = %v", err)
	}
}

func TestMessageWithActionsDecodeError(t *testing.T) {
	for in, want := range map[string]string{
		`{"flags":"x"}`:                              "flags must be a number, got string",
		`{"content":5}`:                              "content must be text, got number",
		`{"embeds":[{"color":"red"}]}`:               "embeds.color must be a number, got string",
		`{"embeds":[{"fields":[{"inline":"yes"}]}]}`: "embeds.fields.inline must be true or false, got string",
		`{"components":[{"type":"button"}]}`:         "components.type must be a number, got string",
		`[]`:                                         "the message must be a JSON object, got array",
	} {
		var m MessageWithActions
		err := json.Unmarshal([]byte(in), &m)
		if err == nil || err.Error() != want {
			t.Errorf("%s: err = %v, want %q", in, err, want)
		}
	}
}

func TestMessageWithActionsEmptyEmbeds(t *testing.T) {
	var m MessageWithActions
	if err := json.Unmarshal([]byte(`{"embeds":[]}`), &m); err != nil {
		t.Fatal(err)
	}
	if m.Embeds == nil || len(m.Embeds) != 0 {
		t.Errorf("embeds = %#v, want an empty list so edits clear them with [] and not null", m.Embeds)
	}
}

func TestCanSendToChannel(t *testing.T) {
	tests := []struct {
		name  string
		perms ActionDerivedPermissions
		want  bool
	}{
		{"listed channel", ActionDerivedPermissions{AllowedChannelIDs: []common.ID{10}}, true},
		{"unlisted channel", ActionDerivedPermissions{AllowedChannelIDs: []common.ID{11}}, false},
		{"owner", ActionDerivedPermissions{GuildIsOwner: true}, true},
		{"administrator", ActionDerivedPermissions{GuildPermissions: uint64(discord.PermissionAdministrator)}, true},
		{"manage webhooks alone", ActionDerivedPermissions{GuildPermissions: uint64(discord.PermissionManageWebhooks)}, false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := test.perms.CanSendToChannel(10); got != test.want {
				t.Fatalf("CanSendToChannel = %v, want %v", got, test.want)
			}
		})
	}
}

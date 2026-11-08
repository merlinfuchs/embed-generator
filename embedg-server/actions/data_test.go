package actions

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/disgoorg/disgo/discord"
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

func TestMessageWithActionsApplySendTime(t *testing.T) {
	var m MessageWithActions
	err := json.Unmarshal([]byte(`{"embeds": [
		{"title": "now", "timestamp_now": true},
		{"title": "now over fixed", "timestamp": "2026-10-07T12:00:00Z", "timestamp_now": true},
		{"title": "fixed", "timestamp": "2026-10-07T12:00:00Z"},
		{"title": "none"}
	]}`), &m)
	if err != nil {
		t.Fatal(err)
	}

	if m.Embeds[1].Timestamp != nil {
		t.Errorf("a fixed timestamp is ignored when the time of sending is used, got %v", m.Embeds[1].Timestamp)
	}

	now := time.Date(2026, 11, 8, 22, 3, 0, 0, time.FixedZone("CST", -6*60*60))
	m.ApplySendTime(now)

	for _, i := range []int{0, 1} {
		if got := m.Embeds[i].Timestamp; got == nil || !got.Equal(now) {
			t.Errorf("embed %d timestamp = %v, want %v", i, got, now)
		}
	}
	if want := time.Date(2026, 10, 7, 12, 0, 0, 0, time.UTC); m.Embeds[2].Timestamp == nil || !m.Embeds[2].Timestamp.Equal(want) {
		t.Errorf("fixed timestamp = %v, want %v", m.Embeds[2].Timestamp, want)
	}
	if m.Embeds[3].Timestamp != nil {
		t.Errorf("embed without a timestamp got %v", m.Embeds[3].Timestamp)
	}

	// Applying it again, as every send does, picks up the new time.
	later := now.Add(time.Minute)
	m.ApplySendTime(later)
	if got := m.Embeds[0].Timestamp; !got.Equal(later) {
		t.Errorf("second send timestamp = %v, want %v", got, later)
	}
}

func TestMessageWithActionsDecodeError(t *testing.T) {
	for in, want := range map[string]string{
		`{"flags":"x"}`:                              "flags must be a number, got string",
		`{"content":5}`:                              "content must be text, got number",
		`{"embeds":[{"color":"red"}]}`:               "embeds.0.color must be a number, got string",
		`{"embeds":[{"fields":[{"inline":"yes"}]}]}`: "embeds.0.fields.0.inline must be true or false, got string",
		`{"components":[{"type":"button"}]}`:         "components.0.type must be a number, got string",
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

func TestMessageWithActionsSuppressEmbeds(t *testing.T) {
	var m MessageWithActions
	if err := json.Unmarshal([]byte(`{"flags":32772}`), &m); err != nil {
		t.Fatal(err)
	}
	if m.Flags != discord.MessageFlagIsComponentsV2 {
		t.Errorf("flags = %d, want only components v2 with suppress embeds dropped", m.Flags)
	}
}

func TestMessageWithActionsEditFlags(t *testing.T) {
	legacy := MessageWithActions{Flags: discord.MessageFlagSuppressNotifications}
	if got := legacy.EditFlags(); got == nil || *got != 0 {
		t.Errorf("legacy edit flags = %v, want 0 so hidden embeds show again", got)
	}

	cv2 := MessageWithActions{Flags: discord.MessageFlagIsComponentsV2 | discord.MessageFlagSuppressNotifications}
	if got := cv2.EditFlags(); got == nil || *got != discord.MessageFlagIsComponentsV2 {
		t.Errorf("components v2 edit flags = %v, want only components v2", got)
	}
}

func TestCanSendToOtherChannels(t *testing.T) {
	tests := []struct {
		name  string
		perms ActionDerivedPermissions
		want  bool
	}{
		{"manage webhooks", ActionDerivedPermissions{GuildPermissions: uint64(discord.PermissionManageWebhooks)}, true},
		{"administrator", ActionDerivedPermissions{GuildPermissions: uint64(discord.PermissionAdministrator)}, true},
		{"owner", ActionDerivedPermissions{GuildIsOwner: true}, true},
		{"send messages only", ActionDerivedPermissions{GuildPermissions: uint64(discord.PermissionSendMessages)}, false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := test.perms.CanSendToOtherChannels(); got != test.want {
				t.Fatalf("CanSendToOtherChannels = %v, want %v", got, test.want)
			}
		})
	}
}

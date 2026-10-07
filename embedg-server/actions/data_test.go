package actions

import (
	"encoding/json"
	"testing"
	"time"
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

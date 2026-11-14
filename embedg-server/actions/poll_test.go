package actions

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/disgoorg/disgo/discord"
)

func pollText(s string) discord.PollMedia {
	return discord.PollMedia{Text: &s}
}

func testPoll(answers ...string) *Poll {
	poll := &Poll{Question: pollText("Pizza or pasta?")}
	for _, answer := range answers {
		poll.Answers = append(poll.Answers, discord.PollAnswer{PollMedia: pollText(answer)})
	}
	return poll
}

func TestPollCheck(t *testing.T) {
	tests := []struct {
		name string
		poll *Poll
		ok   bool
	}{
		{name: "two answers", poll: testPoll("Pizza", "Pasta"), ok: true},
		{name: "one answer", poll: testPoll("Pizza"), ok: true},
		{name: "no answers", poll: testPoll()},
		{name: "ten answers", poll: testPoll(strings.Split("a b c d e f g h i j", " ")...), ok: true},
		{name: "eleven answers", poll: testPoll(strings.Split("a b c d e f g h i j k", " ")...)},
		{name: "empty answer", poll: testPoll("Pizza", " ")},
		{name: "answer at the limit in runes", poll: testPoll(strings.Repeat("ä", 55)), ok: true},
		{name: "answer too long", poll: testPoll(strings.Repeat("a", 56))},
		{name: "empty question", poll: &Poll{Question: pollText(""), Answers: testPoll("Pizza").Answers}},
		{name: "missing question", poll: &Poll{Answers: testPoll("Pizza").Answers}},
		{name: "question at the limit", poll: &Poll{Question: pollText(strings.Repeat("a", 300)), Answers: testPoll("Pizza").Answers}, ok: true},
		{name: "question too long", poll: &Poll{Question: pollText(strings.Repeat("a", 301)), Answers: testPoll("Pizza").Answers}},
		{name: "longest duration", poll: &Poll{Question: pollText("?"), Answers: testPoll("Pizza").Answers, Duration: 768}, ok: true},
		{name: "duration too long", poll: &Poll{Question: pollText("?"), Answers: testPoll("Pizza").Answers, Duration: 769}},
		{name: "negative duration", poll: &Poll{Question: pollText("?"), Answers: testPoll("Pizza").Answers, Duration: -1}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.poll.Check()
			if tt.ok && err != nil {
				t.Fatalf("expected the poll to be valid, got %v", err)
			}
			if !tt.ok && err == nil {
				t.Fatal("expected the poll to be invalid")
			}
		})
	}
}

func TestPollCreate(t *testing.T) {
	poll := testPoll("Pizza", "Pasta")
	poll.AllowMultiselect = true

	create := poll.Create()
	if create.Duration != 24 {
		t.Errorf("expected the default duration of 24 hours, got %d", create.Duration)
	}

	poll.Duration = 72
	create = poll.Create()
	if create.Duration != 72 {
		t.Errorf("expected 72 hours, got %d", create.Duration)
	}

	raw, err := json.Marshal(create)
	if err != nil {
		t.Fatal(err)
	}

	// What Discord reads: the answers wrap their text in poll_media.
	var sent struct {
		Question struct {
			Text string `json:"text"`
		} `json:"question"`
		Answers []struct {
			PollMedia struct {
				Text string `json:"text"`
			} `json:"poll_media"`
		} `json:"answers"`
		Duration         int  `json:"duration"`
		AllowMultiselect bool `json:"allow_multiselect"`
	}
	if err := json.Unmarshal(raw, &sent); err != nil {
		t.Fatal(err)
	}
	if sent.Question.Text != "Pizza or pasta?" || len(sent.Answers) != 2 || sent.Answers[1].PollMedia.Text != "Pasta" {
		t.Errorf("unexpected poll payload: %s", raw)
	}
	if sent.Duration != 72 || !sent.AllowMultiselect {
		t.Errorf("unexpected poll settings: %s", raw)
	}
}

func TestPollDecodesFromEditorJSON(t *testing.T) {
	raw := `{
		"poll": {
			"question": {"text": "Pizza or pasta?"},
			"answers": [
				{"poll_media": {"text": "Pizza", "emoji": {"name": "🍕"}}},
				{"poll_media": {"text": "Pasta", "emoji": {"id": "123456789012345678", "name": "pasta", "animated": true}}}
			],
			"duration": 48,
			"allow_multiselect": true,
			"layout_type": 1
		}
	}`

	var msg MessageWithActions
	if err := json.Unmarshal([]byte(raw), &msg); err != nil {
		t.Fatal(err)
	}
	if msg.Poll == nil {
		t.Fatal("expected the poll to be decoded")
	}
	if err := msg.Poll.Check(); err != nil {
		t.Fatal(err)
	}

	create := msg.Poll.Create()
	if len(create.Answers) != 2 || create.Answers[0].Emoji == nil || *create.Answers[0].Emoji.Name != "🍕" {
		t.Errorf("expected the emoji of the first answer to be kept: %+v", create.Answers)
	}
	if create.Answers[1].Emoji == nil || create.Answers[1].Emoji.ID == nil {
		t.Errorf("expected the custom emoji of the second answer to be kept: %+v", create.Answers)
	}
	if create.Duration != 48 || !create.AllowMultiselect || create.LayoutType != discord.PollLayoutTypeDefault {
		t.Errorf("unexpected poll settings: %+v", create)
	}
}

func TestPollForSend(t *testing.T) {
	poll := testPoll("Pizza", "Pasta")

	tests := []struct {
		name    string
		msg     MessageWithActions
		editing bool
		sent    bool
		wantErr bool
	}{
		{name: "no poll", msg: MessageWithActions{Content: "hi"}},
		{name: "poll", msg: MessageWithActions{Poll: poll}, sent: true},
		{name: "invalid poll", msg: MessageWithActions{Poll: testPoll()}, wantErr: true},
		{name: "edit leaves the poll alone", msg: MessageWithActions{Poll: poll}, editing: true},
		{name: "edit doesn't check the poll", msg: MessageWithActions{Poll: testPoll()}, editing: true},
		{name: "components v2 leaves the poll out", msg: MessageWithActions{Poll: poll, Flags: discord.MessageFlagIsComponentsV2}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			create, err := tt.msg.PollForSend(tt.editing)
			if (err != nil) != tt.wantErr {
				t.Fatalf("unexpected error: %v", err)
			}
			if (create != nil) != tt.sent {
				t.Fatalf("expected sent to be %v, got %+v", tt.sent, create)
			}
		})
	}
}

func TestPollFromMessage(t *testing.T) {
	if PollFromMessage(nil, time.Now()) != nil {
		t.Fatal("expected no poll from a message without one")
	}

	sentAt := time.Date(2026, 11, 1, 12, 0, 0, 0, time.UTC)
	expiry := sentAt.Add(24*time.Hour + 5*time.Minute)
	id := 3

	poll := PollFromMessage(&discord.Poll{
		Question:         pollText("Pizza or pasta?"),
		Answers:          []discord.PollAnswer{{AnswerID: &id, PollMedia: pollText("Pizza")}},
		Expiry:           &expiry,
		AllowMultiselect: true,
		Results:          &discord.PollResults{IsFinalized: true},
	}, sentAt)

	if poll.Duration != 25 {
		t.Errorf("expected the duration to be rounded up to 25 hours, got %d", poll.Duration)
	}
	if poll.Answers[0].AnswerID != nil {
		t.Error("expected the answer ID of the sent message to be dropped")
	}
	if !poll.AllowMultiselect || *poll.Question.Text != "Pizza or pasta?" {
		t.Errorf("unexpected poll: %+v", poll)
	}
	if err := poll.Check(); err != nil {
		t.Errorf("expected the restored poll to be valid, got %v", err)
	}
}

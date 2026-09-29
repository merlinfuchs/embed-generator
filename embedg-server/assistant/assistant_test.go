package assistant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
)

// fakeOpenAI answers every request with a response of the given status and output text, and
// records the request body.
func fakeOpenAI(t *testing.T, status string, reason string, text string) (*Assistant, *map[string]any) {
	t.Helper()

	var body map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/responses" {
			t.Errorf("unexpected path %s", r.URL.Path)
		}
		raw, _ := io.ReadAll(r.Body)
		if err := json.Unmarshal(raw, &body); err != nil {
			t.Errorf("request body isn't JSON: %v", err)
		}

		output, _ := json.Marshal(text)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{
			"id": "resp_1", "object": "response", "created_at": 0, "status": %q, "model": "gpt-5-mini",
			"incomplete_details": {"reason": %q},
			"output": [{"type": "message", "id": "msg_1", "status": "completed", "role": "assistant",
				"content": [{"type": "output_text", "text": %s, "annotations": []}]}],
			"usage": {"input_tokens": 1000, "input_tokens_details": {"cached_tokens": 800},
				"output_tokens": 200, "output_tokens_details": {"reasoning_tokens": 100}, "total_tokens": 1200}
		}`, status, reason, output)
	}))
	t.Cleanup(server.Close)

	client := openai.NewClient(option.WithAPIKey("test"), option.WithBaseURL(server.URL))
	assistant := New(&client, Config{Model: "gpt-5-mini", ReasoningEffort: "low", MaxOutputTokens: 1000})
	return assistant, &body
}

var testGuild = Guild{
	Name:   "Gamers",
	HasBot: true,
	Roles:  []Role{{ID: 2, Name: "Member"}, {ID: 4, Name: "Server Booster", Managed: true}},
	Emojis: []Emoji{{ID: 3, Name: "party", Animated: true}},
	SavedMessages: []SavedMessage{
		{ID: "abc", Name: "Rules"},
	},
	Features: model.PlanFeatures{
		ComponentsV2:           true,
		ComponentTypes:         []int{17, 1, 2},
		MaxActionsPerComponent: 3,
	},
}

func TestRespond(t *testing.T) {
	assistant, body := fakeOpenAI(t, "completed", "", `{"reply": "Added a title.",
		"new_message": {"content": "", "embeds": [{"title": "Welcome"}]}, "fields": [], "build_prompt": null}`)

	messages := []Message{}
	for i := range 12 {
		messages = append(messages, Message{Role: "user", Content: fmt.Sprintf("old %d", i)})
	}
	messages = append(messages, Message{Role: "user", Content: "Add a title"})

	res, err := assistant.Respond(context.Background(), Request{
		Message:  `{"content": "hi"}`,
		Messages: messages,
		Guild:    testGuild,
		UserID:   1,
	})
	if err != nil {
		t.Fatal(err)
	}

	if res.Message != "Added a title." {
		t.Errorf("message = %q", res.Message)
	}
	if res.MessageJSON != `{"content": "", "embeds": [{"title": "Welcome"}]}` {
		t.Errorf("message json = %q", res.MessageJSON)
	}
	// Sent as [] rather than null, which the app can't iterate.
	if res.Issues == nil || len(res.Issues) != 0 {
		t.Errorf("issues = %#v", res.Issues)
	}
	if res.Usage != (model.AssistantUsage{InputTokens: 1000, CachedInputTokens: 800, OutputTokens: 200}) {
		t.Errorf("usage = %+v", res.Usage)
	}

	req := *body
	if req["model"] != "gpt-5-mini" || req["prompt_cache_key"] != "embedg-assistant" {
		t.Errorf("model = %v, prompt_cache_key = %v", req["model"], req["prompt_cache_key"])
	}
	format := req["text"].(map[string]any)["format"].(map[string]any)
	if format["type"] != "json_schema" || format["strict"] != false {
		t.Errorf("format = %v", format)
	}

	// The guild comes first, then of the 12 earlier messages the oldest 5 are dropped, then the
	// current one is sent with the message.
	input := req["input"].([]any)
	if len(input) != 9 {
		t.Fatalf("input has %d items", len(input))
	}
	guild := input[0].(map[string]any)
	if guild["role"] != "developer" {
		t.Errorf("guild role = %v", guild["role"])
	}
	for _, want := range []string{
		"Server: \"Gamers\"",
		"- 2 \"Member\"",
		"- 4 \"Server Booster\" (managed, can't be given or taken)",
		"- <a:party:3>",
		"- abc \"Rules\"",
		"- Component types: 1, 2, 17",
		"- Actions per button or select menu option: 3",
	} {
		if !strings.Contains(guild["content"].(string), want) {
			t.Errorf("guild doesn't contain %q:\n%s", want, guild["content"])
		}
	}
	if input[1].(map[string]any)["content"] != "old 5" {
		t.Errorf("first history message = %v", input[1])
	}
	last := input[8].(map[string]any)["content"].(string)
	if last != "Current message:\n{\"content\": \"hi\"}\n\nAdd a title" {
		t.Errorf("last message = %q", last)
	}
}

func TestRespondRepair(t *testing.T) {
	assistant, body := fakeOpenAI(t, "completed", "", `{"reply": "Fixed.", "new_message": {}, "fields": [], "build_prompt": null}`)

	_, err := assistant.Respond(context.Background(), Request{
		Message: `{}`,
		Messages: []Message{
			{Role: "user", Content: "Add a title"},
			{Role: "assistant", Content: "Added a title."},
			{Role: "user", Content: "Make it red"},
			{Role: "assistant", Content: ""},
		},
		Issues: []string{"embeds.0.color: Expected number, received string"},
		Guild:  testGuild,
	})
	if err != nil {
		t.Fatal(err)
	}

	// The answer without text is left out.
	input := (*body)["input"].([]any)
	if len(input) != 5 {
		t.Fatalf("input has %d items", len(input))
	}
	if input[2].(map[string]any)["role"] != "assistant" || input[3].(map[string]any)["role"] != "user" {
		t.Errorf("roles = %v, %v", input[2], input[3])
	}
	if !strings.Contains(input[4].(map[string]any)["content"].(string), "- embeds.0.color: Expected number, received string") {
		t.Errorf("repair = %v", input[4])
	}
}

func TestRespondCutOff(t *testing.T) {
	assistant, _ := fakeOpenAI(t, "incomplete", "max_output_tokens", `{"reply": "Added`)

	res, err := assistant.Respond(context.Background(), Request{
		Message:  `{}`,
		Messages: []Message{{Role: "user", Content: "Add a title"}},
		Guild:    testGuild,
	})

	var resErr *ErrResponse
	if !errors.As(err, &resErr) || !strings.Contains(resErr.Message, "cut off") {
		t.Fatalf("err = %v", err)
	}
	if res.Usage.InputTokens != 1000 {
		t.Errorf("usage = %+v", res.Usage)
	}
}

func TestDescribeGuildWithoutBot(t *testing.T) {
	desc := describeGuild(Guild{SavedMessages: []SavedMessage{{ID: "abc", Name: "Rules"}}})
	if !strings.HasPrefix(desc, "The bot isn't in this server") {
		t.Errorf("description = %q", desc)
	}
	if strings.Contains(desc, "Roles:") || !strings.Contains(desc, "- abc \"Rules\"") {
		t.Errorf("description = %q", desc)
	}
}

func TestParseOutputInvalidMessage(t *testing.T) {
	res, err := parseOutput(`{"reply": "Done.", "new_message": ["not", "an", "object"], "fields": [], "build_prompt": null}`)
	if err != nil {
		t.Fatal(err)
	}
	// Repaired rather than applied.
	if res.MessageJSON != "" || !reflect.DeepEqual(res.Issues, []string{"new_message isn't a JSON object."}) {
		t.Errorf("message json = %q, issues = %v", res.MessageJSON, res.Issues)
	}
}

func TestParseOutputBuildPrompt(t *testing.T) {
	res, err := parseOutput(`{"reply": "Use a **role button**.", "new_message": null, "fields": [], "build_prompt": "Add a button that gives the Member role"}`)
	if err != nil {
		t.Fatal(err)
	}
	if res.BuildPrompt != "Add a button that gives the Member role" || res.MessageJSON != "" {
		t.Errorf("build prompt = %q, message json = %q", res.BuildPrompt, res.MessageJSON)
	}

	// The suggested change was already made.
	res, err = parseOutput(`{"reply": "Done.", "new_message": {}, "fields": [], "build_prompt": "Add a button"}`)
	if err != nil {
		t.Fatal(err)
	}
	if res.BuildPrompt != "" {
		t.Errorf("build prompt = %q", res.BuildPrompt)
	}
}

func TestParseOutputLimitsFields(t *testing.T) {
	field := `{"label": "Color", "description": "", "type": "choice", "options": [], "default": ""}`
	res, err := parseOutput(`{"reply": "Which color?", "new_message": null, "build_prompt": "Make it red",
		"fields": [` + strings.Repeat(field+",", 4) + field + `]}`)
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Fields) != 4 || res.Fields[0].Type != "text" {
		t.Errorf("fields = %+v", res.Fields)
	}
	// Needs the fields filled in first.
	if res.BuildPrompt != "" {
		t.Errorf("build prompt = %q", res.BuildPrompt)
	}
}

func TestCheckIDs(t *testing.T) {
	res := &Response{MessageJSON: `{"actions": {
		"b": {"actions": [{"type": 2, "target_id": "2"}, {"type": 3, "target_id": "99"}]},
		"a": {"actions": [{"type": 1, "text": "hi"}, {"type": 5, "target_id": "made_up"}, {"type": 10, "role_ids": ["2", "4", "98"]}, {"type": 4, "target_id": "4"}]}
	}}`}
	res.checkIDs(testGuild)

	want := []string{
		`Action 2 of action set "a" uses saved message made_up, which the server doesn't have. Use one from the list, or remove the action and ask the user.`,
		`Action 3 of action set "a" uses role 98, which the server doesn't have. Use one from the list, or remove the action and ask the user.`,
		`Action 4 of action set "a" gives or takes the managed role 4, which isn't possible. Use another role or remove the action.`,
		`Action 2 of action set "b" uses role 99, which the server doesn't have. Use one from the list, or remove the action and ask the user.`,
	}
	if !reflect.DeepEqual(res.Issues, want) {
		t.Errorf("issues = %#v", res.Issues)
	}

	// Without the bot there are no roles to check against.
	res = &Response{MessageJSON: `{"actions": {"a": {"actions": [{"type": 2, "target_id": "99"}]}}}`}
	res.checkIDs(Guild{})
	if len(res.Issues) != 0 {
		t.Errorf("issues = %v", res.Issues)
	}
}

func TestParseOutputIgnoresMalformedFields(t *testing.T) {
	res, err := parseOutput(`{"reply": "Which image?", "new_message": null, "fields": "Image URL", "build_prompt": 3}`)
	if err != nil {
		t.Fatal(err)
	}
	if res.Message != "Which image?" || len(res.Fields) != 0 || res.BuildPrompt != "" {
		t.Errorf("res = %+v", res)
	}
}

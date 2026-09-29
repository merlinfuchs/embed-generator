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

// fakeOpenAI answers the requests with responses of the given status and the output texts in
// order, repeating the last one, and records the request bodies.
func fakeOpenAI(t *testing.T, maxRepairs int, status string, reason string, texts ...string) (*Assistant, *[]map[string]any) {
	t.Helper()

	var bodies []map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/responses" {
			t.Errorf("unexpected path %s", r.URL.Path)
		}
		raw, _ := io.ReadAll(r.Body)
		var body map[string]any
		if err := json.Unmarshal(raw, &body); err != nil {
			t.Errorf("request body isn't JSON: %v", err)
		}
		bodies = append(bodies, body)

		output, _ := json.Marshal(texts[min(len(bodies), len(texts))-1])
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
	assistant := New(&client, Config{Model: "gpt-5-mini", ReasoningEffort: "low", MaxOutputTokens: 1000, MaxRepairs: maxRepairs})
	return assistant, &bodies
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
	assistant, bodies := fakeOpenAI(t, 2, "completed", "", `{"reply": "Added a title.",
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
	if res.MessageJSON != `{"content":"","embeds":[{"title":"Welcome"}]}` || res.Repairs != 0 {
		t.Errorf("message json = %q", res.MessageJSON)
	}
	// Sent as [] rather than null, which the app can't iterate.
	if res.Issues == nil || len(res.Issues) != 0 {
		t.Errorf("issues = %#v", res.Issues)
	}
	if res.Usage != (model.AssistantUsage{InputTokens: 1000, CachedInputTokens: 800, OutputTokens: 200}) {
		t.Errorf("usage = %+v", res.Usage)
	}

	if len(*bodies) != 1 {
		t.Fatalf("made %d requests", len(*bodies))
	}
	req := (*bodies)[0]
	// Per guild, without the guild's ID.
	if key, _ := req["prompt_cache_key"].(string); req["model"] != "gpt-5-mini" || len(key) != 32 {
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
	assistant, bodies := fakeOpenAI(t, 2, "completed", "",
		`{"reply": "Added a role button.", "new_message": {"actions": {"a": {"actions": [{"type": 2, "target_id": "99"}]}}}}`,
		`{"reply": "Fixed.", "new_message": {"actions": {"a": {"actions": [{"type": 2, "target_id": "2"}]}}}}`,
	)

	res, err := assistant.Respond(context.Background(), Request{
		Message: `{}`,
		Messages: []Message{
			{Role: "user", Content: "Add a title"},
			{Role: "assistant", Content: ""},
			{Role: "user", Content: "Add a role button"},
		},
		Guild: testGuild,
	})
	if err != nil {
		t.Fatal(err)
	}

	if len(*bodies) != 2 || res.Repairs != 1 || len(res.Issues) != 0 {
		t.Fatalf("requests = %d, repairs = %d, issues = %v", len(*bodies), res.Repairs, res.Issues)
	}
	if res.Message != "Added a role button." || !strings.Contains(res.MessageJSON, `"target_id":"2"`) {
		t.Errorf("message = %q, message json = %q", res.Message, res.MessageJSON)
	}
	if res.Usage.InputTokens != 2000 {
		t.Errorf("usage = %+v", res.Usage)
	}

	// The repair gets the chat, the request, the answer, then the answer's message with the
	// problems. The answer without text is left out.
	input := (*bodies)[1]["input"].([]any)
	var chat []string
	for _, item := range input[1:] {
		chat = append(chat, item.(map[string]any)["content"].(string))
	}
	if len(chat) != 4 || chat[0] != "Add a title" || chat[1] != "Add a role button" || chat[2] != "Added a role button." {
		t.Fatalf("chat = %q", chat)
	}
	if !strings.Contains(chat[3], `"target_id":"99"`) || !strings.Contains(chat[3], "uses role 99") {
		t.Errorf("repair = %q", chat[3])
	}
}

func TestRespondKeepsProblemsOfTheUser(t *testing.T) {
	// The message already had the unknown role, so it isn't repaired.
	message := `{"actions": {"a": {"actions": [{"type": 2, "target_id": "99"}]}}}`
	assistant, bodies := fakeOpenAI(t, 2, "completed", "", `{"reply": "Added a title.", "new_message": `+message+`}`)

	res, err := assistant.Respond(context.Background(), Request{
		Message:  message,
		Messages: []Message{{Role: "user", Content: "Add a title"}},
		Guild:    testGuild,
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(*bodies) != 1 || res.Repairs != 0 || len(res.Issues) != 0 {
		t.Errorf("requests = %d, repairs = %d, issues = %v", len(*bodies), res.Repairs, res.Issues)
	}
}

func TestRespondStopsWhenRepairChangesNothing(t *testing.T) {
	assistant, bodies := fakeOpenAI(t, 2, "completed", "",
		`{"reply": "Done.", "new_message": {"actions": {"a": {"actions": [{"type": 2, "target_id": "99"}]}}}}`,
		`{"reply": "Fixed.", "new_message": null}`,
	)

	res, err := assistant.Respond(context.Background(), Request{
		Message:  `{}`,
		Messages: []Message{{Role: "user", Content: "Add a role button"}},
		Guild:    testGuild,
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(*bodies) != 2 || res.Repairs != 1 || len(res.Issues) != 1 {
		t.Errorf("requests = %d, repairs = %d, issues = %v", len(*bodies), res.Repairs, res.Issues)
	}
}

func TestRespondStopsRepairing(t *testing.T) {
	assistant, bodies := fakeOpenAI(t, 1, "completed", "",
		`{"reply": "Done.", "new_message": {"actions": {"a": {"actions": [{"type": 2, "target_id": "99"}]}}}}`,
	)

	res, err := assistant.Respond(context.Background(), Request{
		Message:  `{}`,
		Messages: []Message{{Role: "user", Content: "Add a role button"}},
		Guild:    testGuild,
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(*bodies) != 2 || res.Repairs != 1 || len(res.Issues) != 1 {
		t.Errorf("requests = %d, repairs = %d, issues = %v", len(*bodies), res.Repairs, res.Issues)
	}
}

func TestRespondCutOff(t *testing.T) {
	assistant, _ := fakeOpenAI(t, 2, "incomplete", "max_output_tokens", `{"reply": "Added`)

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

func TestInspectInvalidMessage(t *testing.T) {
	// Repaired rather than applied.
	message, issues := inspect(`["not", "an", "object"]`, nil, testGuild)
	if message != "" || !reflect.DeepEqual(issues, []string{"new_message isn't a JSON object."}) {
		t.Errorf("message json = %q, issues = %v", message, issues)
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

func TestParseOutputIgnoresMalformedFields(t *testing.T) {
	res, err := parseOutput(`{"reply": "Which image?", "new_message": null, "fields": "Image URL", "build_prompt": 3}`)
	if err != nil {
		t.Fatal(err)
	}
	if res.Message != "Which image?" || len(res.Fields) != 0 || res.BuildPrompt != "" {
		t.Errorf("res = %+v", res)
	}
}

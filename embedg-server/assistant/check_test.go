package assistant

import (
	"encoding/json"
	"reflect"
	"testing"

	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

func TestCleanUpSharedActionSets(t *testing.T) {
	var msg map[string]any
	json.Unmarshal([]byte(`{
		"components": [{"type": 1, "components": [
			{"type": 2, "style": 1, "action_set_id": "a"},
			{"type": 2, "style": 5, "url": "https://example.com", "action_set_id": "a"},
			{"type": 2, "style": 1, "action_set_id": "a"}
		]}, {"type": 1, "components": [
			{"type": 3, "options": [{"action_set_id": "a_2"}, {"action_set_id": "a"}]}
		]}],
		"actions": {"a": {"actions": [{"type": 1, "text": "hi"}]}, "a_2": {"actions": []}}
	}`), &msg)

	cleanUp(msg)

	var ids []string
	walkComponents(msg, func(c map[string]any, _ string) {
		for _, owner := range actionSetOwners(c) {
			ids = append(ids, owner["action_set_id"].(string))
		}
	})
	// Link buttons have no action set, and "a_2" is taken.
	if want := []string{"a", "a_3", "a_2", "a_4"}; !reflect.DeepEqual(ids, want) {
		t.Errorf("ids = %v, want %v", ids, want)
	}
	sets := msg["actions"].(map[string]any)
	if !reflect.DeepEqual(sets["a_3"], sets["a"]) || !reflect.DeepEqual(sets["a_4"], sets["a"]) {
		t.Errorf("actions = %v", sets)
	}
	// A copy, so changing one doesn't change the other.
	sets["a_3"].(map[string]any)["actions"] = nil
	if sets["a"].(map[string]any)["actions"] == nil {
		t.Error("shared action set was changed")
	}
}

func TestCleanUpSectionsWithoutAccessory(t *testing.T) {
	var msg map[string]any
	json.Unmarshal([]byte(`{"components": [{"type": 17, "components": [
		{"type": 9, "components": [{"type": 10, "content": "a"}, {"type": 10, "content": "b"}]},
		{"type": 9, "components": [{"type": 10, "content": "c"}], "accessory": {"type": 11, "media": {"url": ""}}},
		{"type": 9, "components": [{"type": 10, "content": "d"}], "accessory": {"type": 11, "media": {"url": "https://example.com/a.png"}}}
	]}]}`), &msg)

	cleanUp(msg)

	container := msg["components"].([]any)[0].(map[string]any)
	got, _ := json.Marshal(container["components"])
	want := `[{"content":"a\nb","type":10},{"content":"c","type":10},` +
		`{"accessory":{"media":{"url":"https://example.com/a.png"},"type":11},"components":[{"content":"d","type":10}],"type":9}]`
	if string(got) != want {
		t.Errorf("components = %s", got)
	}
}

func TestCheck(t *testing.T) {
	var msg map[string]any
	json.Unmarshal([]byte(`{
		"flags": 32768,
		"components": [{"type": 13, "file": {"url": "attachment://a.png"}}, {"type": 9, "accessory": {"type": 2, "style": 1}}],
		"actions": {
			"b": {"actions": [{"type": 2, "target_id": "2"}, {"type": 3, "target_id": "99"}]},
			"a": {"actions": [{"type": 1, "text": "hi"}, {"type": 5, "target_id": "made_up"}, {"type": 10, "role_ids": ["2", "4", "98"]}, {"type": 4, "target_id": "4"}]}
		}
	}`), &msg)

	guild := testGuild
	guild.Features = model.PlanFeatures{ComponentTypes: []int{9}, MaxActionsPerComponent: 3}
	want := []string{
		"flags: The plan doesn't include components v2.",
		"components.0: The plan doesn't include components of type 13.",
		"components.1.accessory: The plan doesn't include components of type 2.",
		"actions.a: The plan allows 3 actions per button or option, not 4.",
		`Action 2 of action set "a" uses saved message made_up, which the server doesn't have. Use one from the list, or remove the action and ask the user.`,
		`Action 3 of action set "a" uses role 98, which the server doesn't have. Use one from the list, or remove the action and ask the user.`,
		`Action 4 of action set "a" gives or takes the managed role 4, which isn't possible. Use another role or remove the action.`,
		`Action 2 of action set "b" uses role 99, which the server doesn't have. Use one from the list, or remove the action and ask the user.`,
	}
	if issues := check(msg, guild); !reflect.DeepEqual(issues, want) {
		t.Errorf("issues = %#v", issues)
	}

	// Without the bot there are no roles to check against.
	guild.HasBot = false
	if issues := check(msg, guild); len(issues) != 4 {
		t.Errorf("issues = %v", issues)
	}
}

func TestCleanUpEmptyURLs(t *testing.T) {
	var msg map[string]any
	json.Unmarshal([]byte(`{"avatar_url": "", "embeds": [{
		"title": "Hi", "url": "",
		"image": {"url": ""}, "thumbnail": {"url": "https://example.com/a.png"},
		"footer": {"text": "Bye", "icon_url": ""}
	}]}`), &msg)

	cleanUp(msg)

	want := `{"embeds":[{"footer":{"text":"Bye"},"thumbnail":{"url":"https://example.com/a.png"},"title":"Hi"}]}`
	if got, _ := json.Marshal(msg); string(got) != want {
		t.Errorf("message = %s", got)
	}
}

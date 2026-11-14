package actions

import (
	"strings"
	"testing"
)

func ok() []FormField { return []FormField{{Key: "reason", Label: "Reason", Required: true}} }

func TestValidateForm(t *testing.T) {
	if err := ValidateForm("Report", "Report a user", ok()); err != nil {
		t.Fatal(err)
	}
	cases := map[string]func() (string, string, []FormField){
		"name":   func() (string, string, []FormField) { return "", "T", ok() },
		"title":  func() (string, string, []FormField) { return "n", strings.Repeat("a", 46), ok() },
		"fields": func() (string, string, []FormField) { return "n", "t", nil },
		"6 fields": func() (string, string, []FormField) {
			f := []FormField{}
			for _, k := range []string{"a", "b", "c", "d", "e", "f"} {
				f = append(f, FormField{Key: k, Label: k})
			}
			return "n", "t", f
		},
		"key": func() (string, string, []FormField) { return "n", "t", []FormField{{Key: "Bad Key", Label: "l"}} },
		"dup": func() (string, string, []FormField) {
			return "n", "t", []FormField{{Key: "a", Label: "l"}, {Key: "a", Label: "l"}}
		},
		"label": func() (string, string, []FormField) { return "n", "t", []FormField{{Key: "a"}} },
		"min>max": func() (string, string, []FormField) {
			return "n", "t", []FormField{{Key: "a", Label: "l", MinLength: 10, MaxLength: 5}}
		},
		"max>4000": func() (string, string, []FormField) {
			return "n", "t", []FormField{{Key: "a", Label: "l", MaxLength: 4001}}
		},
		"value>max": func() (string, string, []FormField) {
			return "n", "t", []FormField{{Key: "a", Label: "l", MaxLength: 3, Value: "abcd"}}
		},
		"type": func() (string, string, []FormField) {
			return "n", "t", []FormField{{Key: "a", Label: "l", Type: "color"}}
		},
		"max values": func() (string, string, []FormField) {
			return "n", "t", []FormField{{Key: "a", Label: "l", Type: FormFieldTypeUser, MaxValues: 26}}
		},
		"placeholder": func() (string, string, []FormField) {
			return "n", "t", []FormField{{Key: "a", Label: "l", Placeholder: strings.Repeat("x", 101)}}
		},
	}
	for name, c := range cases {
		n, ti, f := c()
		if err := ValidateForm(n, ti, f); err == nil {
			t.Errorf("%s: expected error", name)
		}
	}
	// 5 fields, 4000 chars and unicode count as runes
	f := []FormField{{Key: "a", Label: "é", MaxLength: 4000, Value: strings.Repeat("é", 4000)}}
	if err := ValidateForm("n", strings.Repeat("é", 45), f); err != nil {
		t.Fatal(err)
	}
}

func TestPlacement(t *testing.T) {
	if err := ValidateShowFormPlacement(ActionSet{Actions: []Action{{Type: 10}, {Type: ActionTypeShowForm}}}); err != nil {
		t.Fatal(err)
	}
	if err := ValidateShowFormPlacement(ActionSet{Actions: []Action{{Type: ActionTypeShowForm}, {Type: 1}}}); err == nil {
		t.Fatal("expected error")
	}
	// A role action that stays quiet leaves the reply to the form, one that answers doesn't.
	quietRole := Action{Type: ActionTypeAddRole, DisableDefaultResponse: true}
	if err := ValidateShowFormPlacement(ActionSet{Actions: []Action{quietRole, {Type: ActionTypeShowForm}}}); err != nil {
		t.Fatal(err)
	}
	for _, before := range []Action{{Type: ActionTypeAddRole}, {Type: ActionTypeTextResponse}, {Type: ActionTypeTextDM, DisableDefaultResponse: true}} {
		if err := ValidateShowFormPlacement(ActionSet{Actions: []Action{before, {Type: ActionTypeShowForm}}}); err == nil {
			t.Fatalf("expected error for action type %d before the form", before.Type)
		}
	}
	if err := ValidateFormActionSet(ActionSet{Actions: []Action{{Type: ActionTypeTextEdit}}}); err == nil {
		t.Fatal("expected error")
	}
	if !(ActionSet{Actions: []Action{{Type: ActionTypeShowForm}}}).ShowsForm() {
		t.Fatal("ShowsForm")
	}
}

func TestValidateFormSelects(t *testing.T) {
	fields := []FormField{
		{Key: "who", Label: "Who", Type: FormFieldTypeUser, Required: true},
		{Key: "roles", Label: "Roles", Type: FormFieldTypeRole, MaxValues: 25},
		{Key: "m", Label: "M", Type: FormFieldTypeMentionable},
		{Key: "c", Label: "C", Type: FormFieldTypeChannel, Placeholder: "Pick one"},
		{Key: "t", Label: "T", Type: FormFieldTypeText},
	}
	if err := ValidateForm("n", "t", fields); err != nil {
		t.Fatal(err)
	}
	if !fields[0].IsEntitySelect() || fields[4].IsEntitySelect() || (FormField{}).IsEntitySelect() {
		t.Fatal("unexpected IsSelect")
	}
}

func TestValidateFormOptionFields(t *testing.T) {
	opts := func(n int) []FormFieldOption {
		o := []FormFieldOption{}
		for i := 0; i < n; i++ {
			v := string(rune('a' + i))
			o = append(o, FormFieldOption{Label: v, Value: v})
		}
		return o
	}
	valid := [][]FormField{
		{{Key: "a", Label: "l", Type: FormFieldTypeSelect, Options: opts(25), MaxValues: 25}},
		{{Key: "a", Label: "l", Type: FormFieldTypeRadio, Options: opts(2)}},
		{{Key: "a", Label: "l", Type: FormFieldTypeCheckboxes, Options: opts(10), MaxValues: 3}},
		{{Key: "a", Label: "l", Type: FormFieldTypeCheckbox, Default: true}},
	}
	for i, f := range valid {
		if err := ValidateForm("n", "t", f); err != nil {
			t.Errorf("valid %d: %v", i, err)
		}
	}

	dup := opts(2)
	dup[1].Value = "a"
	twoDefaults := opts(3)
	twoDefaults[0].Default, twoDefaults[1].Default = true, true
	invalid := map[string][]FormField{
		"one radio option":   {{Key: "a", Label: "l", Type: FormFieldTypeRadio, Options: opts(1)}},
		"11 radio options":   {{Key: "a", Label: "l", Type: FormFieldTypeRadio, Options: opts(11)}},
		"26 select options":  {{Key: "a", Label: "l", Type: FormFieldTypeSelect, Options: opts(26)}},
		"no options":         {{Key: "a", Label: "l", Type: FormFieldTypeCheckboxes}},
		"duplicate values":   {{Key: "a", Label: "l", Type: FormFieldTypeSelect, Options: dup}},
		"empty label":        {{Key: "a", Label: "l", Type: FormFieldTypeSelect, Options: []FormFieldOption{{Value: "x"}}}},
		"empty value":        {{Key: "a", Label: "l", Type: FormFieldTypeSelect, Options: []FormFieldOption{{Label: "x"}}}},
		"two radio defaults": {{Key: "a", Label: "l", Type: FormFieldTypeRadio, Options: twoDefaults}},
		"too many values":    {{Key: "a", Label: "l", Type: FormFieldTypeCheckboxes, Options: opts(3), MaxValues: 4}},
		"defaults over max":  {{Key: "a", Label: "l", Type: FormFieldTypeSelect, Options: twoDefaults}},
	}
	for name, f := range invalid {
		if err := ValidateForm("n", "t", f); err == nil {
			t.Errorf("%s: expected an error", name)
		}
	}
}

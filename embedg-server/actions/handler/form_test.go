package handler

import (
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/snowflake/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

func TestBuildFormModal(t *testing.T) {
	modal := buildFormModal(&model.Form{
		ID:    "abc",
		Title: "Report a user",
		Fields: []actions.FormField{
			{Key: "user", Label: "User", Placeholder: "Who?", Required: true, MaxLength: 40},
			{Key: "reason", Label: "Reason", Paragraph: true, MinLength: 10, Value: "Because"},
		},
	})

	if modal.CustomID != "form:abc" || modal.Title != "Report a user" {
		t.Fatalf("unexpected modal %q %q", modal.CustomID, modal.Title)
	}
	if len(modal.Components) != 2 {
		t.Fatalf("expected 2 components, got %d", len(modal.Components))
	}

	first := modal.Components[0].(discord.LabelComponent)
	firstInput := first.Component.(discord.TextInputComponent)
	if first.Label != "User" || firstInput.CustomID != "user" || firstInput.Style != discord.TextInputStyleShort ||
		!firstInput.Required || firstInput.MaxLength != 40 || firstInput.MinLength != nil || firstInput.Placeholder != "Who?" {
		t.Fatalf("unexpected first input %+v", firstInput)
	}

	second := modal.Components[1].(discord.LabelComponent)
	secondInput := second.Component.(discord.TextInputComponent)
	if secondInput.Style != discord.TextInputStyleParagraph || secondInput.Required ||
		secondInput.MinLength == nil || *secondInput.MinLength != 10 || secondInput.Value != "Because" {
		t.Fatalf("unexpected second input %+v", secondInput)
	}
}

func TestBuildFormModalSelects(t *testing.T) {
	modal := buildFormModal(&model.Form{
		ID:    "abc",
		Title: "Pick",
		Fields: []actions.FormField{
			{Key: "u", Type: actions.FormFieldTypeUser, Label: "User", Required: true, Placeholder: "Who?"},
			{Key: "r", Type: actions.FormFieldTypeRole, Label: "Roles", MaxValues: 3},
			{Key: "m", Type: actions.FormFieldTypeMentionable, Label: "Mention", Required: true, MaxValues: 25},
			{Key: "c", Type: actions.FormFieldTypeChannel, Label: "Channel"},
		},
	})

	user := modal.Components[0].(discord.LabelComponent).Component.(discord.UserSelectMenuComponent)
	if user.CustomID != "u" || !user.Required || user.Placeholder != "Who?" ||
		user.MinValues == nil || *user.MinValues != 1 || user.MaxValues != 1 {
		t.Fatalf("unexpected user select %+v", user)
	}

	role := modal.Components[1].(discord.LabelComponent).Component.(discord.RoleSelectMenuComponent)
	if role.Required || role.MinValues == nil || *role.MinValues != 0 || role.MaxValues != 3 {
		t.Fatalf("unexpected role select %+v", role)
	}

	mentionable := modal.Components[2].(discord.LabelComponent).Component.(discord.MentionableSelectMenuComponent)
	if mentionable.MinValues == nil || *mentionable.MinValues != 1 || mentionable.MaxValues != 25 {
		t.Fatalf("unexpected mentionable select %+v", mentionable)
	}

	channel := modal.Components[3].(discord.LabelComponent).Component.(discord.ChannelSelectMenuComponent)
	if channel.CustomID != "c" || channel.MaxValues != 1 {
		t.Fatalf("unexpected channel select %+v", channel)
	}
}

func TestSubmittedFormValues(t *testing.T) {
	fields := []actions.FormField{
		{Key: "reason", Label: "Reason"},
		{Key: "who", Type: actions.FormFieldTypeUser},
		{Key: "roles", Type: actions.FormFieldTypeRole},
		{Key: "both", Type: actions.FormFieldTypeMentionable},
		{Key: "where", Type: actions.FormFieldTypeChannel},
		{Key: "nobody", Type: actions.FormFieldTypeUser},
	}

	label := func(c discord.LabelSubComponent) discord.LayoutComponent {
		return discord.LabelComponent{Label: "x", Component: c}
	}
	values, ids := submittedFormValues(fields, discord.ModalSubmitInteractionData{
		CustomID: "form:abc",
		Components: []discord.LayoutComponent{
			label(discord.TextInputComponent{CustomID: "reason", Value: "spam"}),
			label(discord.UserSelectMenuComponent{CustomID: "who", Values: []snowflake.ID{1, 2}}),
			label(discord.RoleSelectMenuComponent{CustomID: "roles", Values: []snowflake.ID{3}}),
			label(discord.MentionableSelectMenuComponent{CustomID: "both", Values: []snowflake.ID{4, 5}}),
			label(discord.ChannelSelectMenuComponent{CustomID: "where", Values: []snowflake.ID{6}}),
			label(discord.UserSelectMenuComponent{CustomID: "nobody"}),
		},
		Resolved: discord.ResolvedData{
			Roles: map[snowflake.ID]discord.Role{5: {}},
		},
	})

	want := map[string]string{
		"reason": "spam",
		"who":    "<@1> <@2>",
		"roles":  "<@&3>",
		"both":   "<@4> <@&5>",
		"where":  "<#6>",
		"nobody": "",
	}
	for k, v := range want {
		if values[k] != v {
			t.Errorf("value %q: want %q, got %q", k, v, values[k])
		}
	}

	wantIDs := map[string]string{"who": "1 2", "roles": "3", "both": "4 5", "where": "6", "nobody": ""}
	for k, v := range wantIDs {
		if ids[k] != v {
			t.Errorf("ids %q: want %q, got %q", k, v, ids[k])
		}
	}
	if _, ok := ids["reason"]; ok {
		t.Errorf("text fields have no IDs")
	}
}

func TestBuildFormOptionFields(t *testing.T) {
	opts := []actions.FormFieldOption{
		{Label: "Bug", Value: "bug", Description: "Something broke", Default: true},
		{Label: "Idea", Value: "idea"},
		{Label: "Other", Value: "other"},
	}
	modal := buildFormModal(&model.Form{ID: "a", Title: "t", Fields: []actions.FormField{
		{Key: "s", Type: actions.FormFieldTypeSelect, Label: "S", Required: true, Options: opts, MaxValues: 2, Placeholder: "Pick"},
		{Key: "r", Type: actions.FormFieldTypeRadio, Label: "R", Required: true, Options: opts},
		{Key: "c", Type: actions.FormFieldTypeCheckboxes, Label: "C", Options: opts},
		{Key: "b", Type: actions.FormFieldTypeCheckbox, Label: "B", Default: true},
	}})

	sel := modal.Components[0].(discord.LabelComponent).Component.(discord.StringSelectMenuComponent)
	if len(sel.Options) != 3 || sel.Options[0].Value != "bug" || !sel.Options[0].Default || sel.Options[0].Description != "Something broke" ||
		sel.MaxValues != 2 || sel.MinValues == nil || *sel.MinValues != 1 || sel.Placeholder != "Pick" || !sel.Required {
		t.Fatalf("unexpected select %+v", sel)
	}

	radio := modal.Components[1].(discord.LabelComponent).Component.(discord.RadioGroupComponent)
	if len(radio.Options) != 3 || !radio.Required || !radio.Options[0].Default || radio.CustomID != "r" {
		t.Fatalf("unexpected radio %+v", radio)
	}

	boxes := modal.Components[2].(discord.LabelComponent).Component.(discord.CheckboxGroupComponent)
	if len(boxes.Options) != 3 || boxes.MaxValues != 3 || boxes.MinValues == nil || *boxes.MinValues != 0 || boxes.Required {
		t.Fatalf("unexpected checkboxes %+v", boxes)
	}

	box := modal.Components[3].(discord.LabelComponent).Component.(discord.CheckboxComponent)
	if box.CustomID != "b" || !box.Default {
		t.Fatalf("unexpected checkbox %+v", box)
	}
}

func TestSubmittedOptionFields(t *testing.T) {
	opts := []actions.FormFieldOption{{Label: "Bug", Value: "bug"}, {Label: "Idea", Value: "idea"}}
	fields := []actions.FormField{
		{Key: "s", Type: actions.FormFieldTypeSelect, Options: opts},
		{Key: "r", Type: actions.FormFieldTypeRadio, Options: opts},
		{Key: "norad", Type: actions.FormFieldTypeRadio, Options: opts},
		{Key: "c", Type: actions.FormFieldTypeCheckboxes, Options: opts},
		{Key: "yes", Type: actions.FormFieldTypeCheckbox},
		{Key: "no", Type: actions.FormFieldTypeCheckbox},
	}
	idea := "idea"
	label := func(c discord.LabelSubComponent) discord.LayoutComponent {
		return discord.LabelComponent{Label: "x", Component: c}
	}
	values, ids := submittedFormValues(fields, discord.ModalSubmitInteractionData{
		Components: []discord.LayoutComponent{
			label(discord.StringSelectMenuComponent{CustomID: "s", Values: []string{"bug", "gone"}}),
			label(discord.RadioGroupComponent{CustomID: "r", Value: &idea}),
			label(discord.RadioGroupComponent{CustomID: "norad"}),
			label(discord.CheckboxGroupComponent{CustomID: "c", Values: []string{"idea", "bug"}}),
			label(discord.CheckboxComponent{CustomID: "yes", Value: true}),
			label(discord.CheckboxComponent{CustomID: "no"}),
		},
	})

	want := map[string]string{"s": "Bug, gone", "r": "Idea", "norad": "", "c": "Idea, Bug", "yes": "Yes", "no": "No"}
	for k, v := range want {
		if values[k] != v {
			t.Errorf("value %q: want %q, got %q", k, v, values[k])
		}
	}
	wantIDs := map[string]string{"s": "bug, gone", "r": "idea", "norad": "", "c": "idea, bug", "yes": "true", "no": "false"}
	for k, v := range wantIDs {
		if ids[k] != v {
			t.Errorf("ids %q: want %q, got %q", k, v, ids[k])
		}
	}
}

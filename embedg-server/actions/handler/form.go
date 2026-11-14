package handler

import (
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/snowflake/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/forward"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

func buildFormModal(form *model.Form) discord.ModalCreate {
	components := make([]discord.LayoutComponent, 0, len(form.Fields))
	for _, field := range form.Fields {
		components = append(components, discord.LabelComponent{
			Label:     field.Label,
			Component: buildFormFieldComponent(field),
		})
	}

	return discord.ModalCreate{
		CustomID:   actions.FormCustomIDPrefix + form.ID,
		Title:      form.Title,
		Components: components,
	}
}

func buildFormFieldComponent(field actions.FormField) discord.LabelSubComponent {
	switch {
	case field.IsEntitySelect():
		return buildFormSelect(field)
	case field.HasOptions():
		return buildFormOptions(field)
	case field.Type == actions.FormFieldTypeCheckbox:
		return discord.CheckboxComponent{CustomID: field.Key, Default: field.Default}
	}

	style := discord.TextInputStyleShort
	if field.Paragraph {
		style = discord.TextInputStyleParagraph
	}

	input := discord.TextInputComponent{
		CustomID:    field.Key,
		Style:       style,
		MaxLength:   field.MaxLength,
		Required:    field.Required,
		Placeholder: field.Placeholder,
		Value:       field.Value,
	}
	if field.MinLength > 0 {
		minLength := field.MinLength
		input.MinLength = &minLength
	}
	return input
}

func buildFormSelect(field actions.FormField) discord.LabelSubComponent {
	minValues, maxValues := field.MinPicks(), field.MaxPicks()

	switch field.Type {
	case actions.FormFieldTypeRole:
		return discord.RoleSelectMenuComponent{
			CustomID: field.Key, Placeholder: field.Placeholder,
			Required: field.Required, MinValues: &minValues, MaxValues: maxValues,
		}
	case actions.FormFieldTypeMentionable:
		return discord.MentionableSelectMenuComponent{
			CustomID: field.Key, Placeholder: field.Placeholder,
			Required: field.Required, MinValues: &minValues, MaxValues: maxValues,
		}
	case actions.FormFieldTypeChannel:
		return discord.ChannelSelectMenuComponent{
			CustomID: field.Key, Placeholder: field.Placeholder,
			Required: field.Required, MinValues: &minValues, MaxValues: maxValues,
		}
	default:
		return discord.UserSelectMenuComponent{
			CustomID: field.Key, Placeholder: field.Placeholder,
			Required: field.Required, MinValues: &minValues, MaxValues: maxValues,
		}
	}
}

// buildFormOptions is the select menu, radio buttons or checkboxes of a field with options.
func buildFormOptions(field actions.FormField) discord.LabelSubComponent {
	switch field.Type {
	case actions.FormFieldTypeRadio:
		options := make([]discord.RadioGroupOption, 0, len(field.Options))
		for _, o := range field.Options {
			options = append(options, discord.RadioGroupOption{
				Label: o.Label, Value: o.Value, Description: o.Description, Default: o.Default,
			})
		}
		return discord.RadioGroupComponent{CustomID: field.Key, Required: field.Required, Options: options}

	case actions.FormFieldTypeCheckboxes:
		options := make([]discord.CheckboxGroupOption, 0, len(field.Options))
		for _, o := range field.Options {
			options = append(options, discord.CheckboxGroupOption{
				Label: o.Label, Value: o.Value, Description: o.Description, Default: o.Default,
			})
		}

		minValues := field.MinPicks()
		return discord.CheckboxGroupComponent{
			CustomID: field.Key, Required: field.Required, Options: options,
			MinValues: &minValues, MaxValues: field.MaxPicks(),
		}

	default:
		options := make([]discord.StringSelectMenuOption, 0, len(field.Options))
		for _, o := range field.Options {
			options = append(options, discord.StringSelectMenuOption{
				Label: o.Label, Value: o.Value, Description: o.Description, Default: o.Default,
			})
		}

		minValues := field.MinPicks()
		return discord.StringSelectMenuComponent{
			CustomID: field.Key, Placeholder: field.Placeholder, Required: field.Required,
			MinValues: &minValues, MaxValues: field.MaxPicks(), Options: options,
		}
	}
}

// formAnswer is what was submitted for a field of a form.
type formAnswer struct {
	field actions.FormField
	// value is the text of a text input, the mentions of what was picked in a select field, the
	// labels of the picked options, or Yes or No for a checkbox.
	value string
	// ids is the IDs of what was picked in a select field, the values of the picked options, or
	// true or false for a checkbox. It's nil for text inputs.
	ids []string
}

// formAnswers is what a submitted form contains for each of its fields.
func formAnswers(fields []actions.FormField, data discord.ModalSubmitInteractionData) []formAnswer {
	answers := make([]formAnswer, len(fields))
	for i, field := range fields {
		a := formAnswer{field: field}
		switch {
		case field.HasOptions():
			a.value, a.ids = pickedOptions(data, field)
		case field.IsEntitySelect():
			a.value, a.ids = pickedEntities(data, field)
		case field.Type == actions.FormFieldTypeCheckbox:
			a.value, a.ids = "No", []string{"false"}
			if c, ok := data.Component(field.Key); ok {
				if checkbox, ok := c.(discord.CheckboxComponent); ok && checkbox.Value {
					a.value, a.ids = "Yes", []string{"true"}
				}
			}
		default:
			a.value = data.Text(field.Key)
		}
		answers[i] = a
	}
	return answers
}

// submittedFormValues is what the answers of a form are in templates by field key. The IDs are
// separated by commas for options like their labels are, and by spaces for selects like the
// mentions are.
func submittedFormValues(answers []formAnswer) (values map[string]string, ids map[string]string) {
	values = make(map[string]string, len(answers))
	ids = make(map[string]string)

	for _, a := range answers {
		values[a.field.Key] = a.value
		switch {
		case a.field.HasOptions():
			ids[a.field.Key] = strings.Join(a.ids, ", ")
		case a.ids != nil:
			ids[a.field.Key] = strings.Join(a.ids, " ")
		}
	}
	return values, ids
}

// pickedOptions is the labels, separated by commas, and the values of the options that were
// picked in a field with options.
func pickedOptions(data discord.ModalSubmitInteractionData, field actions.FormField) (labels string, values []string) {
	var picked []string
	if c, ok := data.Component(field.Key); ok {
		switch component := c.(type) {
		case discord.RadioGroupComponent:
			if component.Value != nil {
				picked = []string{*component.Value}
			}
		case discord.CheckboxGroupComponent:
			picked = component.Values
		case discord.StringSelectMenuComponent:
			picked = component.Values
		}
	}

	labelList := make([]string, 0, len(picked))
	values = make([]string, 0, len(picked))
	for _, value := range picked {
		label := value
		for _, o := range field.Options {
			if o.Value == value {
				label = o.Label
				break
			}
		}
		labelList = append(labelList, label)
		values = append(values, value)
	}
	return strings.Join(labelList, ", "), values
}

// pickedEntities is the mentions, separated by spaces, and the IDs of what was picked in a field
// that picks users, roles or channels.
func pickedEntities(data discord.ModalSubmitInteractionData, field actions.FormField) (mentions string, ids []string) {
	picked := modalSelectIDs(data, field)
	mentionList := make([]string, 0, len(picked))
	ids = make([]string, 0, len(picked))
	for _, id := range picked {
		mentionList = append(mentionList, formMention(data, field.Type, id))
		ids = append(ids, id.String())
	}
	return strings.Join(mentionList, " "), ids
}

// formSubmission is what's sent to a URL for a submitted form.
func formSubmission(form *model.Form, interaction discord.Interaction, answers []formAnswer) forward.Submission {
	user := interaction.User()
	sub := forward.Submission{
		Type:    "form_submission",
		Form:    forward.SubmissionForm{ID: form.ID, Name: form.Name},
		GuildID: form.GuildID.String(),
		User: forward.SubmissionUser{
			ID:       user.ID.String(),
			Username: user.Username,
		},
		Fields:      make([]forward.SubmissionField, len(answers)),
		SubmittedAt: interaction.CreatedAt().UTC(),
	}
	if user.GlobalName != nil {
		sub.User.GlobalName = *user.GlobalName
	}
	if channel := interaction.Channel(); channel.MessageChannel != nil {
		sub.ChannelID = channel.ID().String()
	}

	for i, a := range answers {
		fieldType := a.field.Type
		if fieldType == "" {
			fieldType = actions.FormFieldTypeText
		}
		ids := a.ids
		if ids == nil {
			ids = []string{}
		}
		sub.Fields[i] = forward.SubmissionField{
			Key:   a.field.Key,
			Label: a.field.Label,
			Type:  fieldType,
			Value: a.value,
			IDs:   ids,
		}
	}
	return sub
}

// modalSelectIDs is the IDs picked in the select menu of a field of a submitted modal.
func modalSelectIDs(data discord.ModalSubmitInteractionData, field actions.FormField) []snowflake.ID {
	switch field.Type {
	case actions.FormFieldTypeRole:
		if menu, ok := data.RoleSelectMenu(field.Key); ok {
			return menu.Values
		}
	case actions.FormFieldTypeMentionable:
		if menu, ok := data.MentionableSelectMenu(field.Key); ok {
			return menu.Values
		}
	case actions.FormFieldTypeChannel:
		if menu, ok := data.ChannelSelectMenu(field.Key); ok {
			return menu.Values
		}
	default:
		if menu, ok := data.UserSelectMenu(field.Key); ok {
			return menu.Values
		}
	}
	return nil
}

// formMention is the mention of something that was picked in a select field. A mentionable
// select can pick users and roles, which Discord only tells apart in the resolved data.
func formMention(data discord.ModalSubmitInteractionData, fieldType string, id snowflake.ID) string {
	switch fieldType {
	case actions.FormFieldTypeRole:
		return discord.RoleMention(id)
	case actions.FormFieldTypeChannel:
		return discord.ChannelMention(id)
	case actions.FormFieldTypeMentionable:
		if _, ok := data.Resolved.Roles[id]; ok {
			return discord.RoleMention(id)
		}
		return discord.UserMention(id)
	default:
		return discord.UserMention(id)
	}
}

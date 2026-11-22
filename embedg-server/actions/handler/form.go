package handler

import (
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/snowflake/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
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

// submittedFormValues is what a submitted form contains by field key: the text of a text input,
// or the mentions of what was picked in a select field, separated by spaces. The IDs of what was
// picked are returned the same way for the select fields.
func submittedFormValues(fields []actions.FormField, data discord.ModalSubmitInteractionData) (values map[string]string, ids map[string]string) {
	values = make(map[string]string, len(fields))
	ids = make(map[string]string)

	for _, field := range fields {
		switch {
		case field.HasOptions():
			values[field.Key], ids[field.Key] = pickedOptions(data, field)
		case field.IsEntitySelect():
			values[field.Key], ids[field.Key] = pickedEntities(data, field)
		case field.Type == actions.FormFieldTypeCheckbox:
			values[field.Key], ids[field.Key] = "No", "false"
			if c, ok := data.Component(field.Key); ok {
				if checkbox, ok := c.(discord.CheckboxComponent); ok && checkbox.Value {
					values[field.Key], ids[field.Key] = "Yes", "true"
				}
			}
		default:
			values[field.Key] = data.Text(field.Key)
		}
	}
	return values, ids
}

// pickedOptions is the labels and the values of the options that were picked in a field with
// options, each separated by commas.
func pickedOptions(data discord.ModalSubmitInteractionData, field actions.FormField) (labels string, values string) {
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
	valueList := make([]string, 0, len(picked))
	for _, value := range picked {
		label := value
		for _, o := range field.Options {
			if o.Value == value {
				label = o.Label
				break
			}
		}
		labelList = append(labelList, label)
		valueList = append(valueList, value)
	}
	return strings.Join(labelList, ", "), strings.Join(valueList, ", ")
}

// pickedEntities is the mentions and the IDs of what was picked in a field that picks users, roles
// or channels, each separated by spaces.
func pickedEntities(data discord.ModalSubmitInteractionData, field actions.FormField) (mentions string, ids string) {
	picked := modalSelectIDs(data, field)
	mentionList := make([]string, 0, len(picked))
	idList := make([]string, 0, len(picked))
	for _, id := range picked {
		mentionList = append(mentionList, formMention(data, field.Type, id))
		idList = append(idList, id.String())
	}
	return strings.Join(mentionList, " "), strings.Join(idList, " ")
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

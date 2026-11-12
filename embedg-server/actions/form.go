package actions

import (
	"fmt"
	"regexp"
	"unicode/utf8"
)

const (
	// FormCustomIDPrefix starts the custom ID of every form's modal. The rest is the form's ID.
	FormCustomIDPrefix = "form:"

	// The limits are Discord's: a modal has a title of up to 45 characters and 1 to 5 inputs.
	MaxFormFields         = 5
	MaxFormTitleLength    = 45
	MaxFormLabelLength    = 45
	MaxFormPlaceholderLen = 100
	MaxFormValueLength    = 4000
	MaxFormNameLength     = 100
	MaxFormsPerGuild      = 25
	maxFormFieldKeyLength = 32
	// MaxFormSelectValues is how many users, roles or channels a select field can take at most.
	MaxFormSelectValues = 25
)

// The types a form field can have. A text field is what a field without a type is.
const (
	FormFieldTypeText        = "text"
	FormFieldTypeUser        = "user"
	FormFieldTypeRole        = "role"
	FormFieldTypeMentionable = "mentionable"
	FormFieldTypeChannel     = "channel"
	// A select menu, radio buttons and checkboxes pick from options that are set up in the form.
	FormFieldTypeSelect     = "select"
	FormFieldTypeRadio      = "radio"
	FormFieldTypeCheckboxes = "checkboxes"
	// FormFieldTypeCheckbox is a single box that is either checked or not.
	FormFieldTypeCheckbox = "checkbox"
)

// Discord's limits for the options of the different kinds of fields.
const (
	MaxFormSelectOptions   = 25
	MaxFormChoiceOptions   = 10
	MaxFormOptionTextLen   = 100
	minFormRadioOptionsNum = 2
)

// FormFieldOption is one choice of a select, radio or checkboxes field.
type FormFieldOption struct {
	Label string `json:"label"`
	// Value is what the option is called in {{.FormIDs.key}}.
	Value       string `json:"value"`
	Description string `json:"description,omitempty"`
	// Default is whether the option is picked when the form opens.
	Default bool `json:"default,omitempty"`
}

// FormField is one input of a form. Its Key is the name of what was submitted in templates, like
// {{.Form.reason}}, and the custom ID of the input.
type FormField struct {
	Key string `json:"key"`
	// Type is "text" (the default), or what a select menu picks: "user", "role", "mentionable" or
	// "channel".
	Type        string `json:"type,omitempty"`
	Label       string `json:"label"`
	Placeholder string `json:"placeholder,omitempty"`
	// Value is what a text input contains when the form opens.
	Value string `json:"value,omitempty"`
	// Paragraph makes a text input multiline instead of a single line.
	Paragraph bool `json:"paragraph,omitempty"`
	Required  bool `json:"required"`
	MinLength int  `json:"min_length,omitempty"`
	// MaxLength is 0 for no limit of its own, which leaves Discord's 4000 characters.
	MaxLength int `json:"max_length,omitempty"`
	// MaxValues is how many a select menu or checkboxes field can pick, 0 for just one for a
	// select menu and for all options for checkboxes.
	MaxValues int `json:"max_values,omitempty"`
	// Options are the choices of a select, radio or checkboxes field.
	Options []FormFieldOption `json:"options,omitempty"`
	// Default is whether a single checkbox is checked when the form opens.
	Default bool `json:"default,omitempty"`
}

// HasOptions is whether the field picks from options that are set up in the form.
func (f FormField) HasOptions() bool {
	switch f.Type {
	case FormFieldTypeSelect, FormFieldTypeRadio, FormFieldTypeCheckboxes:
		return true
	}
	return false
}

// IsText is whether the field is a text input.
func (f FormField) IsText() bool {
	return f.Type == "" || f.Type == FormFieldTypeText
}

// maxOptions is how many options the field can have at most.
func (f FormField) maxOptions() int {
	if f.Type == FormFieldTypeSelect {
		return MaxFormSelectOptions
	}
	return MaxFormChoiceOptions
}

// IsSelect is whether the field is a select menu instead of a text input.
func (f FormField) IsSelect() bool {
	switch f.Type {
	case FormFieldTypeUser, FormFieldTypeRole, FormFieldTypeMentionable, FormFieldTypeChannel:
		return true
	}
	return false
}

var formFieldKeyRegex = regexp.MustCompile(`^[a-z][a-z0-9_]*$`)

// ValidateForm checks a form against what Discord accepts for a modal, so that opening it can't
// fail later. The errors are meant for whoever builds the form.
func ValidateForm(name string, title string, fields []FormField) error {
	if n := utf8.RuneCountInString(name); n < 1 || n > MaxFormNameLength {
		return fmt.Errorf("the name must be between 1 and %d characters long", MaxFormNameLength)
	}
	if n := utf8.RuneCountInString(title); n < 1 || n > MaxFormTitleLength {
		return fmt.Errorf("the title must be between 1 and %d characters long", MaxFormTitleLength)
	}
	if len(fields) < 1 || len(fields) > MaxFormFields {
		return fmt.Errorf("a form needs between 1 and %d fields", MaxFormFields)
	}

	keys := make(map[string]struct{}, len(fields))
	for i, f := range fields {
		pos := i + 1

		if len(f.Key) > maxFormFieldKeyLength || !formFieldKeyRegex.MatchString(f.Key) {
			return fmt.Errorf("the variable name of field %d must start with a lowercase letter and only contain lowercase letters, digits and underscores (up to %d characters)", pos, maxFormFieldKeyLength)
		}
		if _, ok := keys[f.Key]; ok {
			return fmt.Errorf("the variable name %q is used by more than one field", f.Key)
		}
		keys[f.Key] = struct{}{}

		if n := utf8.RuneCountInString(f.Label); n < 1 || n > MaxFormLabelLength {
			return fmt.Errorf("the label of field %d must be between 1 and %d characters long", pos, MaxFormLabelLength)
		}
		if utf8.RuneCountInString(f.Placeholder) > MaxFormPlaceholderLen {
			return fmt.Errorf("the placeholder of field %d can't be longer than %d characters", pos, MaxFormPlaceholderLen)
		}
		switch {
		case f.IsText():
		case f.IsSelect():
			if f.MaxValues < 0 || f.MaxValues > MaxFormSelectValues {
				return fmt.Errorf("the number of selectable values of field %d must be between 1 and %d", pos, MaxFormSelectValues)
			}
			// The rest only applies to text inputs.
			continue
		case f.HasOptions():
			if err := validateFormOptions(pos, f); err != nil {
				return err
			}
			continue
		case f.Type == FormFieldTypeCheckbox:
			continue
		default:
			return fmt.Errorf("the type of field %d is not valid", pos)
		}

		if f.MinLength < 0 || f.MinLength > MaxFormValueLength {
			return fmt.Errorf("the minimum length of field %d must be between 0 and %d", pos, MaxFormValueLength)
		}
		if f.MaxLength < 0 || f.MaxLength > MaxFormValueLength {
			return fmt.Errorf("the maximum length of field %d must be between 0 and %d", pos, MaxFormValueLength)
		}
		if f.MaxLength != 0 && f.MinLength > f.MaxLength {
			return fmt.Errorf("the minimum length of field %d can't be larger than its maximum length", pos)
		}

		limit := MaxFormValueLength
		if f.MaxLength != 0 {
			limit = f.MaxLength
		}
		if n := utf8.RuneCountInString(f.Value); n > limit {
			return fmt.Errorf("the preset value of field %d can't be longer than %d characters", pos, limit)
		}
	}
	return nil
}

func validateFormOptions(pos int, f FormField) error {
	minOptions := 1
	if f.Type == FormFieldTypeRadio {
		minOptions = minFormRadioOptionsNum
	}
	if len(f.Options) < minOptions || len(f.Options) > f.maxOptions() {
		return fmt.Errorf("field %d needs between %d and %d options", pos, minOptions, f.maxOptions())
	}

	values := make(map[string]struct{}, len(f.Options))
	defaults := 0
	for j, o := range f.Options {
		if n := utf8.RuneCountInString(o.Label); n < 1 || n > MaxFormOptionTextLen {
			return fmt.Errorf("the label of option %d of field %d must be between 1 and %d characters long", j+1, pos, MaxFormOptionTextLen)
		}
		if n := utf8.RuneCountInString(o.Value); n < 1 || n > MaxFormOptionTextLen {
			return fmt.Errorf("the value of option %d of field %d must be between 1 and %d characters long", j+1, pos, MaxFormOptionTextLen)
		}
		if utf8.RuneCountInString(o.Description) > MaxFormOptionTextLen {
			return fmt.Errorf("the description of option %d of field %d can't be longer than %d characters", j+1, pos, MaxFormOptionTextLen)
		}
		if _, ok := values[o.Value]; ok {
			return fmt.Errorf("the value %q is used by more than one option of field %d", o.Value, pos)
		}
		values[o.Value] = struct{}{}
		if o.Default {
			defaults++
		}
	}

	switch f.Type {
	case FormFieldTypeRadio:
		if defaults > 1 {
			return fmt.Errorf("only one option of field %d can be picked by default", pos)
		}
	case FormFieldTypeSelect, FormFieldTypeCheckboxes:
		limit := len(f.Options)
		if f.Type == FormFieldTypeSelect && limit > MaxFormSelectValues {
			limit = MaxFormSelectValues
		}
		if f.MaxValues < 0 || f.MaxValues > limit {
			return fmt.Errorf("the number of selectable values of field %d must be between 1 and %d", pos, limit)
		}
		maxPick := f.MaxValues
		if maxPick == 0 && f.Type == FormFieldTypeSelect {
			maxPick = 1
		}
		if maxPick == 0 {
			maxPick = len(f.Options)
		}
		if defaults > maxPick {
			return fmt.Errorf("field %d has more options picked by default than it can pick", pos)
		}
	}
	return nil
}

// ValidateFormActionSet checks the actions that run when a form is submitted. The form is already
// answered when they run, and a message edit has no message to edit, so those can't be used.
func ValidateFormActionSet(set ActionSet) error {
	for i, a := range set.Actions {
		switch a.Type {
		case ActionTypeTextEdit, ActionTypeSavedMessageEdit:
			return fmt.Errorf("action %d edits the message, which a form can't do", i+1)
		case ActionTypeShowForm:
			return fmt.Errorf("action %d opens a form, which a form can't do", i+1)
		}
	}
	return nil
}

// ValidateShowFormPlacement checks that an action set opens at most one form and does so last.
// Opening it is the response to the interaction, so nothing can respond before it, and nothing
// that runs after it could respond either.
func ValidateShowFormPlacement(set ActionSet) error {
	for i, a := range set.Actions {
		if a.Type != ActionTypeShowForm {
			continue
		}
		if i != len(set.Actions)-1 {
			return fmt.Errorf("action %d opens a form, which has to be the last action", i+1)
		}
	}
	return nil
}

// ShowsForm is whether the action set opens a form.
func (s ActionSet) ShowsForm() bool {
	for _, a := range s.Actions {
		if a.Type == ActionTypeShowForm {
			return true
		}
	}
	return false
}

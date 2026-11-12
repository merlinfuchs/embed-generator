package wire

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
)

// FormFieldOption is one choice of a select, radio or checkboxes field.
type FormFieldOptionWire struct {
	Label string `json:"label"`
	// Value is what the option is called in {{.FormIDs.key}}.
	Value       string `json:"value"`
	Description string `json:"description,omitempty"`
	// Default is whether the option is picked when the form opens.
	Default bool `json:"default,omitempty"`
}

type FormFieldWire struct {
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
	Options []FormFieldOptionWire `json:"options,omitempty"`
	// Default is whether a single checkbox is checked when the form opens.
	Default bool `json:"default,omitempty"`
}

type FormWire struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Title     string            `json:"title"`
	Fields    []FormFieldWire   `json:"fields"`
	Actions   actions.ActionSet `json:"actions"`
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`
}

type FormsListResponseWire APIResponse[[]FormWire]

type FormGetResponseWire APIResponse[FormWire]

type FormCreateRequestWire struct {
	Name    string          `json:"name"`
	Title   string          `json:"title"`
	Fields  []FormFieldWire `json:"fields"`
	Actions json.RawMessage `json:"actions"`
}

// Validate has nothing to check on its own. What makes a form valid, like the limits Discord has
// for modals, is checked by the handler where it can say what's wrong.
func (r FormCreateRequestWire) Validate() error {
	return nil
}

func (r *FormCreateRequestWire) Normalize() {
	r.Name = strings.TrimSpace(r.Name)
	r.Title = strings.TrimSpace(r.Title)
}

type FormCreateResponseWire APIResponse[FormWire]

type FormUpdateRequestWire struct {
	Name    string          `json:"name"`
	Title   string          `json:"title"`
	Fields  []FormFieldWire `json:"fields"`
	Actions json.RawMessage `json:"actions"`
}

func (r FormUpdateRequestWire) Validate() error {
	return nil
}

func (r *FormUpdateRequestWire) Normalize() {
	r.Name = strings.TrimSpace(r.Name)
	r.Title = strings.TrimSpace(r.Title)
}

type FormUpdateResponseWire APIResponse[FormWire]

type FormDeleteResponseWire APIResponse[struct{}]

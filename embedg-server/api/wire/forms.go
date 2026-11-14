package wire

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
)

// FormFieldOptionWire is actions.FormFieldOption, which documents the fields.
type FormFieldOptionWire struct {
	Label       string `json:"label"`
	Value       string `json:"value"`
	Description string `json:"description,omitempty"`
	Default     bool   `json:"default,omitempty"`
}

// FormFieldWire is actions.FormField, which documents the fields.
type FormFieldWire struct {
	Key         string                `json:"key"`
	Type        string                `json:"type,omitempty"`
	Label       string                `json:"label"`
	Placeholder string                `json:"placeholder,omitempty"`
	Value       string                `json:"value,omitempty"`
	Paragraph   bool                  `json:"paragraph,omitempty"`
	Required    bool                  `json:"required"`
	MinLength   int                   `json:"min_length,omitempty"`
	MaxLength   int                   `json:"max_length,omitempty"`
	MaxValues   int                   `json:"max_values,omitempty"`
	Options     []FormFieldOptionWire `json:"options,omitempty"`
	Default     bool                  `json:"default,omitempty"`
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

// FormSaveRequestWire creates or updates a form.
type FormSaveRequestWire struct {
	Name    string          `json:"name"`
	Title   string          `json:"title"`
	Fields  []FormFieldWire `json:"fields"`
	Actions json.RawMessage `json:"actions"`
}

// Validate has nothing to check on its own. What makes a form valid, like the limits Discord has
// for modals, is checked by the handler where it can say what's wrong.
func (r FormSaveRequestWire) Validate() error {
	return nil
}

func (r *FormSaveRequestWire) Normalize() {
	r.Name = strings.TrimSpace(r.Name)
	r.Title = strings.TrimSpace(r.Title)
}

type FormCreateResponseWire APIResponse[FormWire]

type FormUpdateResponseWire APIResponse[FormWire]

type FormDeleteResponseWire APIResponse[struct{}]

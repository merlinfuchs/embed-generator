package wire

import (
	"encoding/json"
	"regexp"
	"time"

	validation "github.com/go-ozzo/ozzo-validation/v4"
	"gopkg.in/guregu/null.v4"
)

type CustomBotInfoWire struct {
	ID                string      `json:"id"`
	ApplicationID     string      `json:"application_id"`
	UserID            string      `json:"user_id"`
	UserName          string      `json:"user_name"`
	UserDiscriminator string      `json:"user_discriminator"`
	UserAvatar        null.String `json:"user_avatar"`

	TokenValid              bool   `json:"token_valid"`
	IsMember                bool   `json:"is_member"`
	HasPermissions          bool   `json:"has_permissions"`
	HandledFirstInteraction bool   `json:"handled_first_interaction"`
	InviteURL               string `json:"invite_url"`
	InteractionEndpointURL  string `json:"interaction_endpoint_url"`
}

type CustomBotConfigureRequestWire struct {
	Token string `json:"token"`
}

func (req CustomBotConfigureRequestWire) Validate() error {
	return nil
}

type CustomBotConfigureResponseWire APIResponse[CustomBotInfoWire]

type CustomBotGetResponseWire APIResponse[CustomBotInfoWire]

type CustomBotDisableResponseDataWire struct{}

type CustomBotDisableResponseWire APIResponse[CustomBotDisableResponseDataWire]

type CustomCommandWire struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Enabled     bool            `json:"enabled"`
	Parameters  json.RawMessage `json:"parameters"`
	Actions     json.RawMessage `json:"actions"`
	CreatedAt   time.Time       `json:"created_at"`
}

type ListCustomCommandsResponseWire APIResponse[[]CustomCommandWire]

type CustomCommandGetResponseWire APIResponse[CustomCommandWire]

type CustomCommandCreateRequestWire struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Parameters  json.RawMessage `json:"parameters"`
	Actions     json.RawMessage `json:"actions"`
}

var commandNameRegex = regexp.MustCompile(`^[-_\p{L}\p{N}]{1,32}$`)

func (r CustomCommandCreateRequestWire) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.Name, validation.Required, validation.Length(1, 32), validation.Match(commandNameRegex)),
		validation.Field(&r.Description, validation.Required, validation.Length(1, 100)),
	)
}

type CustomCommandCreateResponseWire APIResponse[CustomCommandWire]

type CustomCommandUpdateRequestWire struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Enabled     bool            `json:"enabled"`
	Parameters  json.RawMessage `json:"parameters"`
	Actions     json.RawMessage `json:"actions"`
}

func (r CustomCommandUpdateRequestWire) Validate() error {
	return validation.ValidateStruct(&r,
		validation.Field(&r.Name, validation.Required, validation.Length(1, 32), validation.Match(commandNameRegex)),
		validation.Field(&r.Description, validation.Required, validation.Length(1, 100)),
	)
}

type CustomCommandUpdateResponseWire APIResponse[CustomCommandWire]

type CustomCommandDeleteResponseWire APIResponse[struct{}]

type CustomCommandsDeployResponseWire APIResponse[struct{}]

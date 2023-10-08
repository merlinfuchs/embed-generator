package wire

import "gopkg.in/guregu/null.v4"

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

package wire

import "gopkg.in/guregu/null.v4"

type AssistantGenerateMessageRequestWire struct {
	BaseData null.String `json:"base_data"`
	Prompt   string      `json:"prompt"`
}

type AssistantGenerateMessageResponseDataWire struct {
	Data string `json:"data"`
}

type AssistantGenerateMessageResponseWire APIResponse[AssistantGenerateMessageResponseDataWire]

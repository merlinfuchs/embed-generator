package wire

import "gopkg.in/guregu/null.v4"

type GenerateMagicMessageRequestWire struct {
	BaseData null.String `json:"base_data"`
	Prompt   string      `json:"prompt"`
}

type GenerateMagicMessagePromptWire struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type GenerateMagicMessageResponseWire struct {
	Data string `json:"data"`
}

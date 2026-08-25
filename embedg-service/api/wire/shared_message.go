package wire

import (
	"encoding/json"
	"time"
)

type SharedMessageWire struct {
	ID        string          `json:"id"`
	CreatedAt time.Time       `json:"created_at"`
	ExpiresAt time.Time       `json:"expires_at"`
	Data      json.RawMessage `json:"data"`
	URL       string          `json:"url"`
}

type SharedMessageCreateRequestWire struct {
	Data json.RawMessage `json:"data"`
}

func (req SharedMessageCreateRequestWire) Validate() error {
	return nil
}

type SharedMessageCreateResponseWire APIResponse[SharedMessageWire]

type SharedMessageGetResponseWire APIResponse[SharedMessageWire]

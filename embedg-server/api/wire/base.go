package wire

import (
	"encoding/json"
)

type APIResponse[Data any] struct {
	Success bool   `json:"success"`
	Data    Data   `json:"data"`
	Error   *Error `json:"error,omitempty"`
}

type Error struct {
	Status  int             `json:"-"`
	Code    string          `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data,omitempty"`
}

func (e *Error) Error() string {
	return e.Message
}

func (e *Error) MarshalJSON() ([]byte, error) {
	wrapped := APIResponse[any]{
		Success: false,
		Error:   e,
	}

	return json.Marshal(wrapped)
}

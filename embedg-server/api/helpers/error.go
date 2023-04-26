package helpers

import (
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
)

func NotFound(code string, message string) *wire.Error {
	return &wire.Error{
		Status:  fiber.StatusNotFound,
		Code:    code,
		Message: message,
	}
}

func Forbidden(code string, message string) *wire.Error {
	return &wire.Error{
		Status:  fiber.StatusForbidden,
		Code:    code,
		Message: message,
	}
}

func Unauthorized(code string, message string) *wire.Error {
	return &wire.Error{
		Status:  fiber.StatusUnauthorized,
		Code:    code,
		Message: message,
	}
}

func ValidationError(data json.RawMessage) *wire.Error {
	return &wire.Error{
		Status:  fiber.StatusBadRequest,
		Code:    "validation_error",
		Message: "Validation for request body failed",
		Data:    data,
	}
}

func BadRequest(code string, message string) *wire.Error {
	return &wire.Error{
		Status:  fiber.StatusBadRequest,
		Code:    code,
		Message: message,
	}
}

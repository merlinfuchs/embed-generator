package helpers

import (
	"encoding/json"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
)

func WithRequestBody[R any](handler func(c *fiber.Ctx, req R) error) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req R
		if err := c.BodyParser(&req); err != nil {
			return fmt.Errorf("failed to parse request body: %w", err)
		}
		return handler(c, req)
	}
}

type RequestBodyValidatable interface {
	Validate() error
}

func WithRequestBodyValidated[R RequestBodyValidatable](handler func(c *fiber.Ctx, req R) error) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req R
		if err := c.BodyParser(&req); err != nil {
			return fmt.Errorf("failed to parse request body: %w", err)
		}
		if err := ValidateBody(c, req); err != nil {
			return err
		}
		return handler(c, req)
	}
}

func ValidateBody(c *fiber.Ctx, v RequestBodyValidatable) error {
	err := v.Validate()

	if err != nil {
		b, err := json.Marshal(err)
		if err != nil {
			log.Error().Err(err).Msg("Failed to marshal validation error")
		}

		return ValidationError(b)
	}
	return nil
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

func NotFound(code string, message string) *Error {
	return &Error{
		Status:  fiber.StatusNotFound,
		Code:    code,
		Message: message,
	}
}

func Forbidden(code string, message string) *Error {
	return &Error{
		Status:  fiber.StatusForbidden,
		Code:    code,
		Message: message,
	}
}

func Unauthorized(code string, message string) *Error {
	return &Error{
		Status:  fiber.StatusUnauthorized,
		Code:    code,
		Message: message,
	}
}

func ValidationError(data json.RawMessage) *Error {
	return &Error{
		Status:  fiber.StatusBadRequest,
		Code:    "validation_error",
		Message: "Validation for request body failed",
		Data:    data,
	}
}

func BadRequest(code string, message string) *Error {
	return &Error{
		Status:  fiber.StatusBadRequest,
		Code:    code,
		Message: message,
	}
}

package helpers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
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

type RequestBodyNormalizeValidate interface {
	Validate() error
	Normalize()
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
		return ValidationError(err)
	}
	return nil
}

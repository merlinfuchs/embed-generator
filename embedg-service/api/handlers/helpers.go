package handlers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
)

func ParamID(c *fiber.Ctx, name string) (common.ID, error) {
	id := c.Params(name)
	if id == "" {
		return 0, BadRequest("missing_id", fmt.Sprintf("Missing %s", name))
	}

	res, err := common.ParseID(id)
	if err != nil {
		return 0, BadRequest("invalid_id", fmt.Sprintf("Invalid %s: %s", name, id))
	}
	return res, nil
}

func QueryID(c *fiber.Ctx, name string) (common.ID, error) {
	id := c.Query(name)
	if id == "" {
		return 0, BadRequest("missing_id", fmt.Sprintf("Missing %s", name))
	}

	res, err := common.ParseID(id)
	if err != nil {
		return 0, BadRequest("invalid_id", fmt.Sprintf("Invalid %s: %s", name, id))
	}

	return res, nil
}

func QueryNullID(c *fiber.Ctx, name string) (common.NullID, error) {
	id := c.Query(name)
	if id == "" {
		return common.NullID{}, nil
	}

	res, err := common.ParseID(id)
	if err != nil {
		return common.NullID{}, BadRequest("invalid_id", fmt.Sprintf("Invalid %s: %s", name, id))
	}
	return common.NullID{Valid: true, ID: res}, nil
}

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

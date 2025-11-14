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

package health

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type HealthHandler struct {
}

func New() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) HandleHealth(c *fiber.Ctx) error {
	return c.SendStatus(http.StatusOK)
}

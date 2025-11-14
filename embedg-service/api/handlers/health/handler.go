package health

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
)

type HealthHandler struct {
	bot *bot.Bot
}

func New(bot *bot.Bot) *HealthHandler {
	return &HealthHandler{
		bot: bot,
	}
}

func (h *HealthHandler) HandleHealth(c *fiber.Ctx) error {
	return c.SendStatus(http.StatusOK)
}

package users

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"github.com/rs/zerolog/log"
)

type UsersHandler struct {
	userStore store.UserStore
	planStore store.PlanStore
}

func New(userStore store.UserStore, planStore store.PlanStore) *UsersHandler {
	return &UsersHandler{
		userStore: userStore,
		planStore: planStore,
	}
}

func (h *UsersHandler) HandleGetUser(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	rawUserID := c.Params("userID")

	var userID common.ID
	if rawUserID == "@me" {
		userID = session.UserID
	} else {
		var err error
		userID, err = common.ParseID(rawUserID)
		if err != nil {
			return handlers.BadRequest("invalid_user_id", "Invalid user ID")
		}
	}

	user, err := h.userStore.GetUser(c.Context(), userID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("unknown_user", "The user does not exist.")
		}
		log.Error().Err(err).Msg("Failed to get user")
		return err
	}

	return c.JSON(wire.UserResponseWire{
		Success: true,
		Data: wire.UserWire{
			ID:            user.ID,
			Name:          user.Name,
			Discriminator: user.Discriminator,
			Avatar:        user.Avatar,
			IsTester:      user.IsTester,
		},
	})
}

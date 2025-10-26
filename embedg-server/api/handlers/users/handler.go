package users

import (
	"database/sql"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"github.com/rs/zerolog/log"
	"gopkg.in/guregu/null.v4"
)

type UsersHandler struct {
	pg        *postgres.PostgresStore
	planStore store.PlanStore
}

func New(pg *postgres.PostgresStore, planStore store.PlanStore) *UsersHandler {
	return &UsersHandler{
		pg:        pg,
		planStore: planStore,
	}
}

func (h *UsersHandler) HandleGetUser(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	userID := c.Params("userID")

	if userID == "@me" {
		userID = session.UserID.String()
	}

	user, err := h.pg.Q.GetUser(c.Context(), userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("unknown_user", "The user does not exist.")
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
			Avatar:        null.NewString(user.Avatar.String, user.Avatar.Valid),
			IsTester:      user.IsTester,
		},
	})
}

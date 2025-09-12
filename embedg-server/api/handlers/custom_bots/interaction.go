package custom_bots

import (
	"bytes"
	"crypto/ed25519"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/rs/zerolog/log"
)

func (h *CustomBotsHandler) HandleCustomBotInteraction(c *fiber.Ctx) error {
	customBotID := c.Params("customBotID")

	customBot, err := h.pg.Q.GetCustomBot(c.Context(), customBotID)
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("unknown_bot", "Custom bot not found")
		}
		return err
	}

	if !verifyInteractionSignaure(c, customBot.PublicKey) {
		return helpers.Unauthorized("invalid_signature", "Invalid signature")
	}

	interaction := &discordgo.InteractionCreate{}
	err = c.BodyParser(interaction)
	if err != nil {
		return err
	}

	if interaction.AppID != customBot.ApplicationID {
		return fmt.Errorf("application id mismatch")
	}

	err = h.pg.Q.SetCustomBotHandledFirstInteraction(c.Context(), customBotID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to set custom bot handled first interaction")
	}

	if interaction.Type == discordgo.InteractionPing {
		return c.JSON(discordgo.InteractionResponse{
			Type: discordgo.InteractionResponsePong,
		})
	}

	handle := false
	if interaction.Type == discordgo.InteractionMessageComponent {
		data := interaction.MessageComponentData()
		if strings.HasPrefix(data.CustomID, "action:") {
			handle = true
		}
	} else if interaction.Type == discordgo.InteractionApplicationCommand {
		handle = true
	}

	if handle {
		respCh := make(chan *discordgo.InteractionResponse)

		ri := &handler.RestInteraction{
			Inner:           interaction.Interaction,
			Session:         h.bot.Session,
			InitialResponse: respCh,
		}

		go func() {
			session, _ := discordgo.New("Bot " + customBot.Token)

			err := h.bot.ActionHandler.HandleActionInteraction(session, ri)
			if err != nil {
				log.Error().Err(err).Msg("Failed to handle action interaction")
			}
		}()

		select {
		case resp := <-respCh:
			return c.JSON(resp)
		case <-c.Context().Done():
			return c.SendStatus(fiber.StatusNoContent)
		case <-time.After(3 * time.Second):
			return c.SendStatus(fiber.StatusInternalServerError)
		}
	} else {
		return c.SendStatus(fiber.StatusBadRequest)
	}
}

func verifyInteractionSignaure(c *fiber.Ctx, publicKey string) bool {
	key, err := hex.DecodeString(publicKey)
	if err != nil {
		return false
	}

	headers := c.GetReqHeaders()

	signature := headers["X-Signature-Ed25519"]
	if signature == "" {
		return false
	}

	sig, err := hex.DecodeString(signature)
	if err != nil {
		return false
	}

	if len(sig) != ed25519.SignatureSize {
		return false
	}

	timestamp := headers["X-Signature-Timestamp"]
	if timestamp == "" {
		return false
	}

	var msg bytes.Buffer
	msg.WriteString(timestamp)
	msg.Write(c.Body())

	return ed25519.Verify(key, msg.Bytes(), sig)
}

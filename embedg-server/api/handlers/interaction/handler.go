package interaction

import (
	"bytes"
	"crypto/ed25519"
	"encoding/hex"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/bot"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

type InteractionHandler struct {
	bot *bot.Bot
}

func New(bot *bot.Bot) *InteractionHandler {
	return &InteractionHandler{
		bot: bot,
	}
}

func (h *InteractionHandler) HandleBotInteraction(c *fiber.Ctx) error {
	publicKey := viper.GetString("discord.public_key")

	if !verifyInteractionSignaure(c, publicKey) {
		return helpers.Unauthorized("invalid_signature", "Invalid signature")
	}

	interaction := &discordgo.InteractionCreate{}
	err := c.BodyParser(interaction)
	if err != nil {
		return err
	}

	if interaction.Type == discordgo.InteractionPing {
		return c.JSON(discordgo.InteractionResponse{
			Type: discordgo.InteractionResponsePong,
		})
	}

	customAction := false
	switch interaction.Type {
	case discordgo.InteractionMessageComponent:
		data := interaction.MessageComponentData()
		if strings.HasPrefix(data.CustomID, "action:") {
			customAction = true
		}
	}

	respCh := make(chan *discordgo.InteractionResponse)

	ri := &handler.RestInteraction{
		Inner:           interaction.Interaction,
		Session:         h.bot.Session,
		InitialResponse: respCh,
	}

	go func() {
		if customAction {
			err := h.bot.ActionHandler.HandleActionInteraction(h.bot.Session, ri)
			if err != nil {
				log.Error().Err(err).Msg("Failed to handle action interaction")
			}
		} else {
			h.bot.HandlerInteraction(h.bot.Session, ri, interaction.Interaction.Data)
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

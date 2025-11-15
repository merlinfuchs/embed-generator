package interaction

import (
	"bytes"
	"crypto/ed25519"
	"encoding/hex"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/spf13/viper"
)

type InteractionHandler struct {
	dispatcher handler.InteractionDispatcher
	rest       rest.Rest
}

func New(dispatcher handler.InteractionDispatcher, rest rest.Rest) *InteractionHandler {
	return &InteractionHandler{
		dispatcher: dispatcher,
		rest:       rest,
	}
}

func (h *InteractionHandler) HandleBotInteraction(c *fiber.Ctx) error {
	publicKey := viper.GetString("discord.public_key")

	if !verifyInteractionSignaure(c, publicKey) {
		return handlers.Unauthorized("invalid_signature", "Invalid signature")
	}

	interaction := &events.InteractionCreate{}
	err := c.BodyParser(interaction)
	if err != nil {
		return err
	}

	if interaction.Type() == discord.InteractionTypePing {
		return c.JSON(discord.InteractionResponse{
			Type: discord.InteractionResponseTypePong,
		})
	}

	respCh := make(chan *discord.InteractionResponse)

	ri := &handler.RestInteraction{
		Inner:           interaction.Interaction,
		Rest:            h.rest,
		InitialResponse: respCh,
	}

	h.dispatcher.DispatchInteraction(ri)

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

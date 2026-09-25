package interaction

import (
	"bytes"
	"crypto/ed25519"
	"encoding/hex"
	"log/slog"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

type InteractionHandlerConfig struct {
	DiscordPublicKey string
}

type InteractionHandler struct {
	config     InteractionHandlerConfig
	dispatcher store.EventDispatcher
	rest       rest.Rest
}

func New(config InteractionHandlerConfig, dispatcher store.EventDispatcher, rest rest.Rest) *InteractionHandler {
	return &InteractionHandler{
		config:     config,
		dispatcher: dispatcher,
		rest:       rest,
	}
}

func (h *InteractionHandler) HandleBotInteraction(c *fiber.Ctx) error {
	if !verifyInteractionSignaure(c, h.config.DiscordPublicKey) {
		return handlers.Unauthorized("invalid_signature", "Invalid signature")
	}

	interaction, err := discord.UnmarshalInteraction(c.Body())
	if err != nil {
		return err
	}

	if interaction.Type() == discord.InteractionTypePing {
		return c.JSON(discord.InteractionResponse{
			Type: discord.InteractionResponseTypePong,
		})
	}

	responder := handlers.NewInteractionResponder()

	go func() {
		// Nothing above this recovers, and any guild member can trigger an interaction.
		defer func() {
			if r := recover(); r != nil {
				slog.Error(
					"Panic while handling bot interaction",
					slog.Any("panic", r),
				)
			}
		}()

		h.dispatcher.DispatchEvent(&events.InteractionCreate{
			GenericEvent: h.dispatcher.GenericEvent(),
			Interaction:  interaction,
			Respond:      responder.Respond,
		})
	}()

	return responder.Wait(c)
}

func verifyInteractionSignaure(c *fiber.Ctx, publicKey string) bool {
	key, err := hex.DecodeString(publicKey)
	if err != nil || len(key) != ed25519.PublicKeySize {
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

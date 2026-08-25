package interaction

import (
	"bytes"
	"crypto/ed25519"
	"encoding/hex"
	"sync"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
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

	respCh := make(chan *discord.InteractionResponse)

	var (
		responded bool
		expired   bool
		mu        sync.Mutex
	)

	respondFunc := func(responseType discord.InteractionResponseType, data discord.InteractionResponseData, opts ...rest.RequestOpt) error {
		mu.Lock()
		defer mu.Unlock()

		if responded {
			return discord.ErrInteractionAlreadyReplied
		}

		if expired {
			return discord.ErrInteractionExpired
		}

		respCh <- &discord.InteractionResponse{
			Type: responseType,
			Data: data,
		}
		responded = true
		return nil
	}

	go h.dispatcher.DispatchEvent(&events.InteractionCreate{
		GenericEvent: h.dispatcher.GenericEvent(),
		Interaction:  interaction,
		Respond:      respondFunc,
	})

	select {
	case resp := <-respCh:
		mu.Lock()
		expired = true
		mu.Unlock()
		return c.JSON(resp)
	case <-c.Context().Done():
		return c.SendStatus(fiber.StatusNoContent)
	case <-time.After(3 * time.Second):
		mu.Lock()
		expired = true
		mu.Unlock()
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

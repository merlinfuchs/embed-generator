package custom_bots

import (
	"bytes"
	"crypto/ed25519"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"log/slog"

	"github.com/disgoorg/disgo/discord"
	disrest "github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/handler"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/embedg/rest"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

func (h *CustomBotsHandler) HandleCustomBotInteraction(c *fiber.Ctx) error {
	customBotID := c.Params("customBotID")

	customBot, err := h.customBotManager.GetCustomBot(c.UserContext(), customBotID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("unknown_bot", "Custom bot not found")
		}
		return err
	}

	if !verifyInteractionSignaure(c, customBot.PublicKey) {
		return handlers.Unauthorized("invalid_signature", "Invalid signature")
	}

	interaction, err := discord.UnmarshalInteraction(c.Body())
	if err != nil {
		return err
	}

	if interaction.ApplicationID() != customBot.ApplicationID {
		return fmt.Errorf("application id mismatch")
	}

	err = h.customBotManager.SetCustomBotHandledFirstInteraction(c.UserContext(), customBotID)
	if err != nil {
		slog.Error("Failed to set custom bot handled first interaction", slog.Any("error", err))
	}

	if interaction.Type() == discord.InteractionTypePing {
		return c.JSON(discord.InteractionResponse{
			Type: discord.InteractionResponseTypePong,
		})
	}

	handle := false
	switch i := interaction.(type) {
	case discord.ComponentInteraction:
		if strings.HasPrefix(i.Data.CustomID(), "action:") {
			handle = true
		}
	case discord.ApplicationCommandInteraction:
		handle = true
	}

	if handle {
		// Buffered: this handler stops reading after three seconds, and the send must not block
		// the goroutine below forever when it does.
		respCh := make(chan *discord.InteractionResponse, 1)
		client := rest.ClientForToken(customBot.Token)

		// Called once at most, so the buffer always has room.
		ri := handler.NewInteraction(interaction, client, func(responseType discord.InteractionResponseType, data discord.InteractionResponseData, _ ...disrest.RequestOpt) error {
			respCh <- &discord.InteractionResponse{Type: responseType, Data: data}
			return nil
		})

		go func() {
			// Nothing recovers a panic in here, and an interaction is something any member of the
			// guild can trigger.
			defer func() {
				if r := recover(); r != nil {
					slog.Error(
						"Panic while handling custom bot interaction",
						slog.String("custom_bot_id", customBotID),
						slog.Any("panic", r),
					)
				}
			}()

			err := h.actionHandler.HandleActionInteraction(client, ri)
			if err != nil {
				slog.Error("Failed to handle action interaction", slog.Any("error", err))
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

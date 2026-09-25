package handlers

import (
	"encoding/json"
	"errors"
	"net/http/httptest"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/gofiber/fiber/v2"
)

func TestInteractionResponderAnswersTheRequest(t *testing.T) {
	var second error
	app := fiber.New()
	app.Post("/", func(c *fiber.Ctx) error {
		r := NewInteractionResponder()
		if err := r.Respond(discord.InteractionResponseTypeDeferredUpdateMessage, nil); err != nil {
			t.Fatal(err)
		}
		second = r.Respond(discord.InteractionResponseTypeCreateMessage, nil)
		return r.Wait(c)
	})

	resp, err := app.Test(httptest.NewRequest("POST", "/", nil))
	if err != nil {
		t.Fatal(err)
	}

	var body discord.InteractionResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body.Type != discord.InteractionResponseTypeDeferredUpdateMessage {
		t.Fatalf("want the first response, got %+v", body)
	}
	if !errors.Is(second, discord.ErrInteractionAlreadyReplied) {
		t.Fatalf("want a second response rejected, got %v", second)
	}
}

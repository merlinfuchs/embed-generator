package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"mime"
	"mime/multipart"
	"net/http/httptest"
	"strings"
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

func TestInteractionResponderSendsFiles(t *testing.T) {
	app := fiber.New()
	app.Post("/", func(c *fiber.Ctx) error {
		r := NewInteractionResponder()
		if err := r.Respond(discord.InteractionResponseTypeCreateMessage, discord.MessageCreate{
			Files: []*discord.File{{Name: "message.json", Reader: strings.NewReader(`{"a":1}`)}},
			Flags: discord.MessageFlagEphemeral,
		}); err != nil {
			t.Fatal(err)
		}
		return r.Wait(c)
	})

	resp, err := app.Test(httptest.NewRequest("POST", "/", nil))
	if err != nil {
		t.Fatal(err)
	}

	mediaType, params, err := mime.ParseMediaType(resp.Header.Get("Content-Type"))
	if err != nil || mediaType != "multipart/form-data" {
		t.Fatalf("want multipart, got %q", resp.Header.Get("Content-Type"))
	}
	form, err := multipart.NewReader(resp.Body, params["boundary"]).ReadForm(1 << 20)
	if err != nil {
		t.Fatal(err)
	}
	if len(form.File["files[0]"]) != 1 {
		t.Fatalf("want one file, got %v", form.File)
	}
	f, err := form.File["files[0]"][0].Open()
	if err != nil {
		t.Fatal(err)
	}
	file, err := io.ReadAll(f)
	if err != nil {
		t.Fatal(err)
	}
	if string(file) != `{"a":1}` {
		t.Fatalf("want the file, got %q", file)
	}
	if payload := form.Value["payload_json"]; len(payload) != 1 || !strings.Contains(payload[0], `"flags":64`) {
		t.Fatalf("want the message in the payload, got %q", payload)
	}
}

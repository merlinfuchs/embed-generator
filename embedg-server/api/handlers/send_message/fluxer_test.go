package send_message

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
)

func TestCheckFluxerMessage(t *testing.T) {
	tests := []struct {
		name string
		data actions.MessageWithActions
		req  wire.MessageSendToWebhookRequestWire
		ok   bool
	}{
		{
			name: "content and embeds",
			data: actions.MessageWithActions{Content: "hi", Embeds: []discord.Embed{{Title: "title"}}},
			ok:   true,
		},
		{
			name: "components",
			data: actions.MessageWithActions{Components: []actions.ComponentWithActions{{Type: discord.ComponentTypeActionRow}}},
		},
		{
			name: "components v2",
			data: actions.MessageWithActions{Flags: discord.MessageFlagIsComponentsV2},
		},
		{
			name: "thread",
			req:  wire.MessageSendToWebhookRequestWire{ThreadID: common.NullID{ID: 1, Valid: true}},
		},
		{
			name: "attachments on a new message",
			req:  wire.MessageSendToWebhookRequestWire{Attachments: []*wire.MessageAttachmentWire{{Name: "a.png"}}},
			ok:   true,
		},
		{
			name: "attachments on an edit",
			req: wire.MessageSendToWebhookRequestWire{
				MessageID:   common.NullID{ID: 1, Valid: true},
				Attachments: []*wire.MessageAttachmentWire{{Name: "a.png"}},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := checkFluxerMessage(&tt.data, tt.req)
			if (err == nil) != tt.ok {
				t.Fatalf("want ok=%v, got %v", tt.ok, err)
			}
		})
	}
}

type fluxerRequest struct {
	method string
	uri    string
	body   map[string]any
}

// fakeFluxer answers like Fluxer's webhook routes and records what it was sent.
func fakeFluxer(t *testing.T, status int, response string) (*SendMessageHandler, *[]fluxerRequest) {
	t.Helper()

	var requests []fluxerRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw, _ := io.ReadAll(r.Body)
		req := fluxerRequest{method: r.Method, uri: r.URL.RequestURI()}
		_ = json.Unmarshal(raw, &req.body)
		requests = append(requests, req)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		_, _ = w.Write([]byte(response))
	}))
	t.Cleanup(srv.Close)

	h := &SendMessageHandler{
		fluxerRest:   rest.New(rest.NewClient("", rest.WithURL(srv.URL+"/v1"))),
		actionParser: &parser.ActionParser{},
	}
	return h, &requests
}

func sendToFluxer(t *testing.T, h *SendMessageHandler, req wire.MessageSendToWebhookRequestWire) *http.Response {
	t.Helper()

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			var e *wire.Error
			if errors.As(err, &e) {
				return c.Status(e.Status).JSON(e)
			}
			return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
		},
	})
	app.Post("/", func(c *fiber.Ctx) error {
		return h.HandleSendMessageToWebhook(c, req)
	})

	resp, err := app.Test(httptest.NewRequest(http.MethodPost, "/", nil))
	if err != nil {
		t.Fatal(err)
	}
	return resp
}

const fluxerMessage = `{"id":"1500000000000000002","channel_id":"1500000000000000003","author":{"id":"1500000000000000001","username":"Hook","avatar":null},"content":"hi","type":0,"flags":0}`

func TestSendToFluxerWebhook(t *testing.T) {
	h, requests := fakeFluxer(t, http.StatusOK, fluxerMessage)

	resp := sendToFluxer(t, h, wire.MessageSendToWebhookRequestWire{
		WebhookPlatform: wire.WebhookPlatformFluxer,
		WebhookID:       "1500000000000000001",
		WebhookToken:    "token",
		Data:            json.RawMessage(`{"content":"hi"}`),
	})
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("want 200, got %d: %s", resp.StatusCode, body)
	}

	if len(*requests) != 1 {
		t.Fatalf("want one request to Fluxer, got %d", len(*requests))
	}
	got := (*requests)[0]
	if got.method != http.MethodPost || got.uri != "/v1/webhooks/1500000000000000001/token?wait=true" {
		t.Fatalf("want the execute webhook route without with_components, got %s %s", got.method, got.uri)
	}
	if got.body["content"] != "hi" {
		t.Fatalf("want the content sent, got %v", got.body)
	}
}

func TestEditFluxerWebhookMessage(t *testing.T) {
	h, requests := fakeFluxer(t, http.StatusOK, fluxerMessage)

	resp := sendToFluxer(t, h, wire.MessageSendToWebhookRequestWire{
		WebhookPlatform: wire.WebhookPlatformFluxer,
		WebhookID:       "1500000000000000001",
		WebhookToken:    "token",
		MessageID:       common.NullID{ID: 1500000000000000002, Valid: true},
		Data:            json.RawMessage(`{"content":"edited"}`),
	})
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("want 200, got %d: %s", resp.StatusCode, body)
	}

	got := (*requests)[0]
	if got.method != http.MethodPatch || !strings.HasPrefix(got.uri, "/v1/webhooks/1500000000000000001/token/messages/1500000000000000002") {
		t.Fatalf("want the edit webhook message route, got %s %s", got.method, got.uri)
	}
	if strings.Contains(got.uri, "with_components") {
		t.Fatalf("want no with_components for Fluxer, got %s", got.uri)
	}
	// Fluxer's edits only take content, embeds, flags and allowed mentions.
	if _, ok := got.body["components"]; ok {
		t.Fatalf("want no components in the edit, got %v", got.body)
	}
}

func TestFluxerErrors(t *testing.T) {
	tests := []struct {
		name     string
		status   int
		response string
		want     int
	}{
		{name: "unknown webhook", status: http.StatusNotFound, response: `{"code":"UNKNOWN_WEBHOOK","message":"Unknown webhook."}`, want: http.StatusNotFound},
		{name: "invalid body", status: http.StatusBadRequest, response: `{"code":"INVALID_FORM_BODY","message":"Invalid form body"}`, want: http.StatusBadRequest},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h, _ := fakeFluxer(t, tt.status, tt.response)

			resp := sendToFluxer(t, h, wire.MessageSendToWebhookRequestWire{
				WebhookPlatform: wire.WebhookPlatformFluxer,
				WebhookID:       "1500000000000000001",
				WebhookToken:    "token",
				Data:            json.RawMessage(`{"content":"hi"}`),
			})
			if resp.StatusCode != tt.want {
				body, _ := io.ReadAll(resp.Body)
				t.Fatalf("want %d, got %d: %s", tt.want, resp.StatusCode, body)
			}
		})
	}
}

func TestFluxerAvatarURL(t *testing.T) {
	avatar := "abc"
	user := discord.User{ID: 1500000000000000001, Avatar: &avatar}
	if got := fluxerAvatarURL(user); got != "https://fluxerusercontent.com/avatars/1500000000000000001/abc.png" {
		t.Fatalf("got %s", got)
	}
	if got := fluxerAvatarURL(discord.User{ID: 1}); got != "" {
		t.Fatalf("want no avatar URL without an avatar, got %s", got)
	}
}

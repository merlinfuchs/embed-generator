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
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
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
	// body is the JSON body, or the payload_json part of a multipart one.
	body  map[string]any
	files map[string]string
}

// fakeFluxer answers like Fluxer's webhook routes and records what it was sent.
func fakeFluxer(t *testing.T, status int, response string) (*SendMessageHandler, *[]fluxerRequest) {
	t.Helper()

	var requests []fluxerRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		req := fluxerRequest{method: r.Method, uri: r.URL.RequestURI(), files: map[string]string{}}
		if strings.HasPrefix(r.Header.Get("Content-Type"), "multipart/form-data") {
			if err := r.ParseMultipartForm(1 << 20); err != nil {
				t.Errorf("invalid multipart body: %v", err)
			}
			_ = json.Unmarshal([]byte(r.FormValue("payload_json")), &req.body)
			for field, headers := range r.MultipartForm.File {
				req.files[field] = headers[0].Filename
			}
		} else {
			raw, _ := io.ReadAll(r.Body)
			_ = json.Unmarshal(raw, &req.body)
		}
		requests = append(requests, req)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		_, _ = w.Write([]byte(response))
	}))
	t.Cleanup(srv.Close)

	return &SendMessageHandler{fluxer: newFluxerClient(srv.URL + "/v1")}, &requests
}

// run calls the handler the way the API would and returns the response body, and the error it
// hands to the API.
func run(t *testing.T, handler func(c *fiber.Ctx) error) ([]byte, error) {
	t.Helper()

	var handlerErr error
	app := fiber.New()
	app.Post("/", func(c *fiber.Ctx) error {
		handlerErr = handler(c)
		return nil
	})

	resp, err := app.Test(httptest.NewRequest(http.MethodPost, "/", nil))
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(resp.Body)
	return body, handlerErr
}

func sendToFluxer(t *testing.T, h *SendMessageHandler, req wire.MessageSendToWebhookRequestWire) error {
	t.Helper()

	_, err := run(t, func(c *fiber.Ctx) error { return h.HandleSendMessageToWebhook(c, req) })
	return err
}

func fluxerSendRequest(data string) wire.MessageSendToWebhookRequestWire {
	return wire.MessageSendToWebhookRequestWire{
		WebhookPlatform: wire.WebhookPlatformFluxer,
		WebhookID:       "1500000000000000001",
		WebhookToken:    "token",
		Data:            json.RawMessage(data),
	}
}

const fluxerMessageResponse = `{"id":"1500000000000000002","channel_id":"1500000000000000003","webhook_id":"1500000000000000001","author":{"id":"1500000000000000001","username":"Hook","avatar":"abc","discriminator":"0000","global_name":null,"bot":true},"type":0,"flags":4,"content":"hi","timestamp":"2026-09-30T10:00:00.000Z","edited_timestamp":null,"pinned":false,"mention_everyone":false,"tts":false,"mentions":[],"mention_roles":[],"embeds":[{"type":"rich","title":"Title","color":16711680,"fields":[{"name":"a","value":"b","inline":true}]}],"attachments":[],"nonce":null}`

func TestSendToFluxerWebhook(t *testing.T) {
	h, requests := fakeFluxer(t, http.StatusOK, fluxerMessageResponse)

	if err := sendToFluxer(t, h, fluxerSendRequest(`{"content":"hi","username":"Hook"}`)); err != nil {
		t.Fatal(err)
	}

	if len(*requests) != 1 {
		t.Fatalf("want one request to Fluxer, got %d", len(*requests))
	}
	got := (*requests)[0]
	if got.method != http.MethodPost || got.uri != "/v1/webhooks/1500000000000000001/token?wait=true" {
		t.Fatalf("want the execute webhook route, got %s %s", got.method, got.uri)
	}
	if got.body["content"] != "hi" || got.body["username"] != "Hook" {
		t.Fatalf("want the content and username sent, got %v", got.body)
	}
}

func TestSendFilesToFluxerWebhook(t *testing.T) {
	h, requests := fakeFluxer(t, http.StatusOK, fluxerMessageResponse)

	req := fluxerSendRequest(`{"content":"hi"}`)
	req.Attachments = []*wire.MessageAttachmentWire{{Name: "a.png", DataURL: "data:image/png;base64,aGk="}}
	if err := sendToFluxer(t, h, req); err != nil {
		t.Fatal(err)
	}

	got := (*requests)[0]
	if got.files["files[0]"] != "a.png" {
		t.Fatalf("want the file in files[0], got %v", got.files)
	}
	attachments, _ := got.body["attachments"].([]any)
	if len(attachments) != 1 || attachments[0].(map[string]any)["filename"] != "a.png" {
		t.Fatalf("want the file named in the payload, got %v", got.body)
	}
}

func TestEditFluxerWebhookMessage(t *testing.T) {
	h, requests := fakeFluxer(t, http.StatusOK, fluxerMessageResponse)

	req := fluxerSendRequest(`{"content":"edited"}`)
	req.MessageID = common.NullID{ID: 1500000000000000002, Valid: true}
	if err := sendToFluxer(t, h, req); err != nil {
		t.Fatal(err)
	}

	got := (*requests)[0]
	if got.method != http.MethodPatch || got.uri != "/v1/webhooks/1500000000000000001/token/messages/1500000000000000002" {
		t.Fatalf("want the edit webhook message route, got %s %s", got.method, got.uri)
	}
	// Only what Fluxer's edits take, which has no files or components.
	for key := range got.body {
		if key != "content" && key != "embeds" && key != "allowed_mentions" {
			t.Fatalf("want only fields Fluxer's edit takes, got %v", got.body)
		}
	}
	if embeds, ok := got.body["embeds"].([]any); !ok || len(embeds) != 0 {
		t.Fatalf("want an empty embed list to clear the embeds, got %v", got.body["embeds"])
	}
}

func TestRestoreFromFluxerWebhook(t *testing.T) {
	h, requests := fakeFluxer(t, http.StatusOK, fluxerMessageResponse)

	body, err := run(t, func(c *fiber.Ctx) error {
		return h.HandleRestoreMessageFromWebhook(c, wire.MessageRestoreFromWebhookRequestWire{
			WebhookPlatform: wire.WebhookPlatformFluxer,
			WebhookID:       1500000000000000001,
			WebhookToken:    "token",
			MessageID:       1500000000000000002,
		})
	})
	if err != nil {
		t.Fatal(err)
	}

	got := (*requests)[0]
	if got.method != http.MethodGet || got.uri != "/v1/webhooks/1500000000000000001/token/messages/1500000000000000002" {
		t.Fatalf("want the get webhook message route, got %s %s", got.method, got.uri)
	}

	var resp wire.MessageRestoreResponseWire
	if err := json.Unmarshal(body, &resp); err != nil {
		t.Fatal(err)
	}
	var data actions.MessageWithActions
	if err := json.Unmarshal(resp.Data.Data, &data); err != nil {
		t.Fatal(err)
	}
	if data.Content != "hi" || data.Username != "Hook" || len(data.Embeds) != 1 || len(data.Embeds[0].Fields) != 1 {
		t.Fatalf("want the message restored, got %+v", data)
	}
	if data.AvatarURL != "https://fluxerusercontent.com/avatars/1500000000000000001/abc.png" {
		t.Fatalf("want the avatar from Fluxer's CDN, got %s", data.AvatarURL)
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
		{name: "rate limited", status: http.StatusTooManyRequests, response: `{"code":"RATE_LIMITED","message":"You are being rate limited.","global":false,"retry_after":0.4}`, want: http.StatusBadRequest},
		{name: "not json", status: http.StatusForbidden, response: `forbidden`, want: http.StatusBadRequest},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h, requests := fakeFluxer(t, tt.status, tt.response)

			err := sendToFluxer(t, h, fluxerSendRequest(`{"content":"hi"}`))
			var e *wire.Error
			if !errors.As(err, &e) || e.Status != tt.want {
				t.Fatalf("want a %d error, got %v", tt.want, err)
			}
			// A 429 goes back to the user rather than being retried.
			if len(*requests) != 1 {
				t.Fatalf("want one request to Fluxer, got %d", len(*requests))
			}
		})
	}
}

package embed_links

import (
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

const componentEmbedPrefix = `<script id="discord:component-embed" type="application/json">`

func TestComponentEmbedToHTML(t *testing.T) {
	html := componentEmbedToHTML([]byte(
		`{"component":{"type":17,"components":[{"type":10,"content":"</script><b>hi</b>"}]}}`,
	), false)

	if !strings.HasPrefix(html, componentEmbedPrefix) {
		t.Fatalf("expected a script element, got %q", html)
	}
	payload, _, _ := strings.Cut(strings.TrimPrefix(html, componentEmbedPrefix), "</script>")
	if strings.Contains(payload, "<") {
		t.Fatalf("content was not escaped: %s", html)
	}
}

func TestComponentEmbedToHTMLSkipsEmptyPayloads(t *testing.T) {
	if html := componentEmbedToHTML(nil, true); html != "" {
		t.Fatalf("expected no script element, got %q", html)
	}
}

// jsonb returns the payload with a space after every colon and comma.
func TestComponentEmbedToHTMLCompactsPayload(t *testing.T) {
	html := componentEmbedToHTML([]byte(
		`{"component": {"type": 17, "components": [{"type": 10, "content": "a, b: c"}]}}`,
	), false)

	want := componentEmbedPrefix + `{"component":{"type":17,"components":[{"type":10,"content":"a, b: c"}]}}` + "</script>\n"
	if html != want {
		t.Fatalf("got %q, want %q", html, want)
	}
}

func TestComponentEmbedToHTMLAddsAttribution(t *testing.T) {
	html := componentEmbedToHTML([]byte(
		`{"component": {"type": 17, "components": [{"type": 10, "content": "<b>hi</b>"}]}}`,
	), true)

	want := componentEmbedPrefix + `{"component":{"type":17,"components":[{"type":10,"content":"\u003cb\u003ehi\u003c/b\u003e"},{"type":10,"content":"-# Link preview from [message.style](https://message.style)"}]}}` + "</script>\n"
	if html != want {
		t.Fatalf("got %q, want %q", html, want)
	}
}

func TestUnknownEmbedLinkIsNotFound(t *testing.T) {
	h := New(EmbedLinksHandlerConfig{AppPublicURL: "https://message.style/app"}, nil, nil)
	app := fiber.New()
	app.Get("/e/unknown", h.renderUnknownEmbedLinkHTML)

	resp, err := app.Test(httptest.NewRequest("GET", "/e/unknown", nil))
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != fiber.StatusNotFound {
		t.Fatalf("got status %d, want 404", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	if !strings.Contains(string(body), `"https://message.style/app/tools/embed-links"`) {
		t.Fatalf("expected a redirect to the embed links tool, got %s", body)
	}
}

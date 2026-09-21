package embed_links

import (
	"strings"
	"testing"
)

const componentEmbedPrefix = `<script id="discord:component-embed" type="application/json">`

func TestComponentEmbedToHTML(t *testing.T) {
	html := componentEmbedToHTML([]byte(
		`{"component":{"type":17,"components":[{"type":10,"content":"</script><b>hi</b>"}]}}`,
	))

	if !strings.HasPrefix(html, componentEmbedPrefix) {
		t.Fatalf("expected a script element, got %q", html)
	}
	payload, _, _ := strings.Cut(strings.TrimPrefix(html, componentEmbedPrefix), "</script>")
	if strings.Contains(payload, "<") {
		t.Fatalf("content was not escaped: %s", html)
	}
}

func TestComponentEmbedToHTMLSkipsEmptyPayloads(t *testing.T) {
	if html := componentEmbedToHTML(nil); html != "" {
		t.Fatalf("expected no script element, got %q", html)
	}
}

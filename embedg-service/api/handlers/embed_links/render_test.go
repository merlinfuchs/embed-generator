package embed_links

import "testing"

func TestComponentEmbedToHTML(t *testing.T) {
	html := componentEmbedToHTML([]byte(
		`{"component":{"type":17,"components":[{"type":10,"content":"</script><b>hi</b>"}]}}`,
	))

	if html == "" {
		t.Fatalf("expected a script element")
	}
	if got, want := html[:len(`<script id="discord:component-embed" type="application/json">`)],
		`<script id="discord:component-embed" type="application/json">`; got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
	if contains(html[len(`<script id="discord:component-embed" type="application/json">`):], "</script><b>") {
		t.Fatalf("content was not escaped: %s", html)
	}
}

func TestComponentEmbedToHTMLSkipsInvalidPayloads(t *testing.T) {
	if html := componentEmbedToHTML([]byte(`{"component":{"type":10}}`)); html != "" {
		t.Fatalf("expected no script element, got %q", html)
	}
}

func contains(haystack, needle string) bool {
	for i := 0; i+len(needle) <= len(haystack); i++ {
		if haystack[i:i+len(needle)] == needle {
			return true
		}
	}
	return false
}

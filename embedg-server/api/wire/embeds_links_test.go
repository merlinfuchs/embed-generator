package wire

import "testing"

func TestEmbedLinkURLMustBeWebURL(t *testing.T) {
	for _, u := range []string{"https://example.com", "http://example.com/path?q=1"} {
		if err := (EmbedLinkCreateRequestWire{Url: u}).Validate(); err != nil {
			t.Errorf("want %q to be valid, got %v", u, err)
		}
	}
	for _, u := range []string{"google.com", "d", "//example.com", "javascript:alert(1)", "https://", "[x](https://discord.gg/abc)"} {
		if err := (EmbedLinkCreateRequestWire{Url: u}).Validate(); err == nil {
			t.Errorf("want %q to be rejected", u)
		}
	}
}

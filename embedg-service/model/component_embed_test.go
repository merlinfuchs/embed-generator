package model_test

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

func TestParseComponentEmbed(t *testing.T) {
	tests := []struct {
		name    string
		payload string
		wantErr bool
	}{
		{
			name:    "container with a text display",
			payload: `{"component":{"type":17,"accent_color":1752220,"components":[{"type":10,"content":"# Hello"}]}}`,
		},
		{
			name:    "section with a link button accessory",
			payload: `{"component":{"type":17,"components":[{"type":9,"components":[{"type":10,"content":"Hi"}],"accessory":{"type":2,"style":5,"url":"https://message.style","label":"Open"}}]}}`,
		},
		{
			name:    "root is not a container",
			payload: `{"component":{"type":10,"content":"Hello"}}`,
			wantErr: true,
		},
		{
			name:    "unknown key",
			payload: `{"component":{"type":17,"components":[{"type":10,"content":"Hi","custom_id":"x"}]}}`,
			wantErr: true,
		},
		{
			name:    "select menu",
			payload: `{"component":{"type":17,"components":[{"type":1,"components":[{"type":3}]}]}}`,
			wantErr: true,
		},
		{
			name:    "file",
			payload: `{"component":{"type":17,"components":[{"type":13,"file":{"url":"https://message.style/a.png"}}]}}`,
			wantErr: true,
		},
		{
			name:    "non link button",
			payload: `{"component":{"type":17,"components":[{"type":1,"components":[{"type":2,"style":1,"label":"Click"}]}]}}`,
			wantErr: true,
		},
		{
			name:    "button without a label or emoji",
			payload: `{"component":{"type":17,"components":[{"type":1,"components":[{"type":2,"style":5,"url":"https://message.style"}]}]}}`,
			wantErr: true,
		},
		{
			name:    "field of another component type",
			payload: `{"component":{"type":17,"components":[{"type":14,"content":"Hi"}]}}`,
			wantErr: true,
		},
		{
			name:    "nested container",
			payload: `{"component":{"type":17,"components":[{"type":17,"components":[{"type":10,"content":"Hi"}]}]}}`,
			wantErr: true,
		},
		{
			name:    "empty container",
			payload: `{"component":{"type":17,"components":[]}}`,
			wantErr: true,
		},
		{
			name:    "media url with a bad scheme",
			payload: `{"component":{"type":17,"components":[{"type":12,"items":[{"media":{"url":"javascript:alert(1)"}}]}]}}`,
			wantErr: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, err := model.ParseComponentEmbed([]byte(test.payload))
			if test.wantErr && err == nil {
				t.Fatalf("expected an error")
			}
			if !test.wantErr && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

// The payload goes into a script element, so nothing in it may close one.
func TestComponentEmbedMarshalEscapesHTML(t *testing.T) {
	embed, err := model.ParseComponentEmbed([]byte(
		`{"component":{"type":17,"components":[{"type":10,"content":"</script><img src=x onerror=alert(1)>"}]}}`,
	))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	payload, err := json.Marshal(embed)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if strings.Contains(string(payload), "<") {
		t.Fatalf("payload contains an unescaped angle bracket: %s", payload)
	}
}

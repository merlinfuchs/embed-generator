package wire

import "testing"

func TestWebhookRequestValidate(t *testing.T) {
	tests := []struct {
		name     string
		platform WebhookPlatform
		token    string
		ok       bool
	}{
		{name: "discord", platform: WebhookPlatformDiscord, token: "abc_DEF-123", ok: true},
		{name: "fluxer", platform: WebhookPlatformFluxer, token: "abcDEF123", ok: true},
		{name: "no platform from an older app", token: "abc", ok: true},
		{name: "unknown platform", platform: "guilded", token: "abc"},
		{name: "no token", platform: WebhookPlatformDiscord},
		{name: "token with a path", platform: WebhookPlatformDiscord, token: "abc/../../users/@me"},
		{name: "token with a query", platform: WebhookPlatformFluxer, token: "abc?wait=false"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			send := MessageSendToWebhookRequestWire{WebhookPlatform: tt.platform, WebhookToken: tt.token}
			if err := send.Validate(); (err == nil) != tt.ok {
				t.Fatalf("send: want ok=%v, got %v", tt.ok, err)
			}

			restore := MessageRestoreFromWebhookRequestWire{WebhookPlatform: tt.platform, WebhookToken: tt.token}
			if err := restore.Validate(); (err == nil) != tt.ok {
				t.Fatalf("restore: want ok=%v, got %v", tt.ok, err)
			}
		})
	}
}

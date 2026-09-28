package guilds

import (
	"testing"

	"github.com/disgoorg/disgo/discord"
)

func TestUserCanManageWebhooks(t *testing.T) {
	tests := []struct {
		name  string
		guild discord.OAuth2Guild
		want  bool
	}{
		// Discord leaves the owner's implicit permissions out of the field.
		{"owner without roles", discord.OAuth2Guild{Owner: true}, true},
		{"administrator", discord.OAuth2Guild{Permissions: discord.PermissionAdministrator}, true},
		{"manage webhooks", discord.OAuth2Guild{Permissions: discord.PermissionManageWebhooks}, true},
		{"neither", discord.OAuth2Guild{Permissions: discord.PermissionSendMessages}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := userCanManageWebhooks(tt.guild); got != tt.want {
				t.Errorf("userCanManageWebhooks() = %v, want %v", got, tt.want)
			}
		})
	}
}

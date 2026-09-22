package session

import (
	"testing"

	"golang.org/x/oauth2"
)

// Discord returns the granted scopes as a space separated string next to the token, which is the
// only signal in the callback that the user opted into joining the support guild.
func TestHasScope(t *testing.T) {
	token := (&oauth2.Token{AccessToken: "token"}).WithExtra(map[string]any{
		"scope": "identify guilds guilds.members.read guilds.join",
	})

	if !HasScope(token, ScopeGuildsJoin) {
		t.Errorf("HasScope(%q) = false, want true, granted: %v", ScopeGuildsJoin, GrantedScopes(token))
	}

	without := (&oauth2.Token{AccessToken: "token"}).WithExtra(map[string]any{
		"scope": "identify guilds guilds.members.read",
	})
	if HasScope(without, ScopeGuildsJoin) {
		t.Errorf("HasScope(%q) = true without the scope granted", ScopeGuildsJoin)
	}
}

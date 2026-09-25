package parser

import (
	"testing"

	"github.com/disgoorg/disgo/discord"
)

func TestRoleBelow(t *testing.T) {
	low := discord.Role{ID: 5, Position: 1}
	high := discord.Role{ID: 6, Position: 2}
	// Same position as low, but created earlier, so Discord sorts it above.
	older := discord.Role{ID: 4, Position: 1}

	tests := []struct {
		name string
		a, b discord.Role
		want bool
	}{
		{"lower position", low, high, true},
		{"higher position", high, low, false},
		{"equal position, higher id", low, older, true},
		{"equal position, lower id", older, low, false},
		{"same role", low, low, false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := roleBelow(test.a, test.b); got != test.want {
				t.Fatalf("roleBelow = %v, want %v", got, test.want)
			}
		})
	}
}

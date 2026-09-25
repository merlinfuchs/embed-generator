package handler

import (
	"reflect"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/snowflake/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
)

func TestActionAllowedMentions(t *testing.T) {
	users := discord.AllowedMentionTypeUsers
	roles := discord.AllowedMentionTypeRoles
	everyone := discord.AllowedMentionTypeEveryone

	tests := []struct {
		name              string
		allowRoleMentions bool
		saved             *discord.AllowedMentions
		want              discord.AllowedMentions
	}{
		{
			name: "users only by default",
			want: discord.AllowedMentions{Parse: []discord.AllowedMentionType{users}},
		},
		{
			name:              "roles and everyone when the action allows them",
			allowRoleMentions: true,
			want:              discord.AllowedMentions{Parse: []discord.AllowedMentionType{users, roles, everyone}},
		},
		{
			name:              "the saved message narrows what the action allows",
			allowRoleMentions: true,
			saved:             &discord.AllowedMentions{Parse: []discord.AllowedMentionType{roles}},
			want:              discord.AllowedMentions{Parse: []discord.AllowedMentionType{roles}},
		},
		{
			name:  "the saved message can't widen it",
			saved: &discord.AllowedMentions{Parse: []discord.AllowedMentionType{users, everyone}, Roles: []snowflake.ID{1}},
			want:  discord.AllowedMentions{Parse: []discord.AllowedMentionType{users}},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := actionAllowedMentions(actions.Action{AllowRoleMentions: tt.allowRoleMentions}, tt.saved)
			if !reflect.DeepEqual(*got, tt.want) {
				t.Fatalf("want %+v, got %+v", tt.want, *got)
			}
		})
	}
}

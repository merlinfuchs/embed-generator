package access

import (
	"encoding/json"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/guildstate"
)

const (
	guildID   = common.ID(1)
	everyone  = common.ID(1) // @everyone role id equals the guild id
	staffRole = common.ID(2)
	userID    = common.ID(99)
	ownerID   = common.ID(7)
)

func channel(t *testing.T, raw string) discord.GuildChannel {
	t.Helper()
	var c discord.UnmarshalChannel
	if err := json.Unmarshal([]byte(raw), &c); err != nil {
		t.Fatal(err)
	}
	return c.Channel.(discord.GuildChannel)
}

func stateWith(t *testing.T, channels ...discord.GuildChannel) *guildstate.State {
	t.Helper()
	return &guildstate.State{
		Guild: discord.Guild{ID: guildID, OwnerID: ownerID},
		Roles: []discord.Role{
			{ID: everyone, Permissions: discord.PermissionViewChannel},
			{ID: staffRole, Permissions: discord.PermissionViewChannel | discord.PermissionManageWebhooks},
		},
		Channels: channels,
	}
}

func TestMaxChannelPermissions(t *testing.T) {
	locked := `{"id":"10","type":0,"guild_id":"1","name":"locked","permission_overwrites":[{"id":"2","type":0,"allow":"0","deny":"536870912"}]}`
	open := `{"id":"11","type":0,"guild_id":"1","name":"open","permission_overwrites":[]}`
	category := `{"id":"12","type":4,"guild_id":"1","name":"cat","permission_overwrites":[]}`

	tests := []struct {
		name       string
		channels   []string
		userID     common.ID
		roleIDs    []common.ID
		wantAccess bool
	}{
		{"one usable channel among several", []string{locked, open}, userID, []common.ID{staffRole}, true},
		{"every channel denies the role", []string{locked}, userID, []common.ID{staffRole}, false},
		{"categories can't be posted in", []string{category}, userID, []common.ID{staffRole}, false},
		{"without the role that grants it", []string{open}, userID, nil, false},
		{"owner ignores overwrites", []string{locked}, ownerID, nil, true},
		{"guild with no channels", nil, userID, []common.ID{staffRole}, false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			channels := make([]discord.GuildChannel, len(test.channels))
			for i, raw := range test.channels {
				channels[i] = channel(t, raw)
			}

			got := maxChannelPermissions(stateWith(t, channels...), test.userID, test.roleIDs, RequiredPermissions)
			if hasAccess := got&discord.PermissionManageWebhooks != 0; hasAccess != test.wantAccess {
				t.Fatalf("access = %v, want %v (permissions %d)", hasAccess, test.wantAccess, got)
			}
		})
	}
}

package access

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/guildstate"
)

const (
	guildID   = common.ID(1)
	everyone  = common.ID(1) // @everyone role id equals the guild id
	staffRole = common.ID(2)
	adminRole = common.ID(3)
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
			{ID: adminRole, Permissions: discord.PermissionAdministrator},
		},
		Channels: channels,
	}
}

func TestMaxChannelPermissions(t *testing.T) {
	locked := `{"id":"10","type":0,"guild_id":"1","name":"locked","permission_overwrites":[{"id":"2","type":0,"allow":"0","deny":"536870912"}]}`
	open := `{"id":"11","type":0,"guild_id":"1","name":"open","permission_overwrites":[]}`
	category := `{"id":"12","type":4,"guild_id":"1","name":"cat","permission_overwrites":[]}`
	// Hides itself from @everyone, which is how a private staff channel is set up.
	hidden := `{"id":"13","type":0,"guild_id":"1","name":"hidden","permission_overwrites":[{"id":"1","type":0,"allow":"0","deny":"1024"}]}`
	// Same, but the staff role is let back in.
	hiddenAllowed := `{"id":"14","type":0,"guild_id":"1","name":"hidden-allowed","permission_overwrites":[{"id":"1","type":0,"allow":"0","deny":"1024"},{"id":"2","type":0,"allow":"1024","deny":"0"}]}`

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
		{"channel the member can't see", []string{hidden}, userID, []common.ID{staffRole}, false},
		{"channel that lets the role back in", []string{hiddenAllowed}, userID, []common.ID{staffRole}, true},
		{"owner sees hidden channels", []string{hidden}, ownerID, nil, true},
		{"administrator ignores overwrites", []string{locked}, userID, []common.ID{adminRole}, true},
		{"administrator sees hidden channels", []string{hidden}, userID, []common.ID{adminRole}, true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			channels := make([]discord.GuildChannel, len(test.channels))
			for i, raw := range test.channels {
				channels[i] = channel(t, raw)
			}

			member := discord.Member{User: discord.User{ID: test.userID}, RoleIDs: test.roleIDs}
			got := maxChannelPermissions(stateWith(t, channels...), member, RequiredPermissions)
			if hasAccess := got&discord.PermissionManageWebhooks != 0; hasAccess != test.wantAccess {
				t.Fatalf("access = %v, want %v (permissions %d)", hasAccess, test.wantAccess, got)
			}
		})
	}
}

func TestMemberPermissionsTimedOut(t *testing.T) {
	open := channel(t, `{"id":"11","type":0,"guild_id":"1","name":"open","permission_overwrites":[]}`)
	state := stateWith(t, open)
	future := time.Now().Add(time.Hour)
	past := time.Now().Add(-time.Hour)

	tests := []struct {
		name    string
		userID  common.ID
		roleIDs []common.ID
		until   *time.Time
		want    discord.Permissions
	}{
		{"timed out member keeps only view and history", userID, []common.ID{staffRole}, &future, discord.PermissionViewChannel},
		{"expired timeout changes nothing", userID, []common.ID{staffRole}, &past, discord.PermissionViewChannel | discord.PermissionManageWebhooks},
		{"administrator is exempt", userID, []common.ID{adminRole}, &future, discord.PermissionsAll},
		{"owner is exempt", ownerID, nil, &future, discord.PermissionsAll},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			member := discord.Member{User: discord.User{ID: test.userID}, RoleIDs: test.roleIDs, CommunicationDisabledUntil: test.until}
			if got := memberPermissions(&state.Guild, state.Roles, open, member); got != test.want {
				t.Fatalf("permissions = %d, want %d", got, test.want)
			}
		})
	}
}

func TestPermissionSource(t *testing.T) {
	parent := channel(t, `{"id":"10","type":0,"guild_id":"1","name":"parent","permission_overwrites":[]}`)
	thread := channel(t, `{"id":"20","type":11,"guild_id":"1","name":"thread","parent_id":"10"}`)

	withParent := stateWith(t, parent)
	if got := permissionSource(thread, withParent); got.ID() != parent.ID() {
		t.Fatalf("thread did not inherit from its parent, got %d", got.ID())
	}

	// A thread whose parent isn't in the guild's channel list still has to resolve to something.
	if got := permissionSource(thread, stateWith(t)); got.ID() != thread.ID() {
		t.Fatalf("orphan thread fell back to %d", got.ID())
	}

	// A normal channel is its own source.
	if got := permissionSource(parent, withParent); got.ID() != parent.ID() {
		t.Fatalf("plain channel resolved to %d", got.ID())
	}
}

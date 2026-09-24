package custom_bot

import (
	"reflect"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/omit"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"gopkg.in/guregu/null.v4"
)

func TestPresenceData(t *testing.T) {
	tests := []struct {
		name       string
		customBot  model.CustomBot
		status     discord.OnlineStatus
		activities []discord.Activity
	}{
		{
			name:      "status without activity",
			customBot: model.CustomBot{GatewayStatus: "dnd"},
			status:    discord.OnlineStatusDND,
		},
		{
			name: "custom status uses the state",
			customBot: model.CustomBot{
				GatewayStatus:        "online",
				GatewayActivityType:  null.IntFrom(4),
				GatewayActivityName:  null.StringFrom("hello"),
				GatewayActivityState: null.StringFrom("hello"),
			},
			status: discord.OnlineStatusOnline,
			activities: []discord.Activity{{
				Name:  "Custom Status",
				Type:  discord.ActivityTypeCustom,
				State: omit.Ptr("hello"),
			}},
		},
		{
			name: "streaming carries the url",
			customBot: model.CustomBot{
				GatewayStatus:       "idle",
				GatewayActivityType: null.IntFrom(1),
				GatewayActivityName: null.StringFrom("something"),
				GatewayActivityUrl:  null.StringFrom("https://twitch.tv/x"),
			},
			status: discord.OnlineStatusIdle,
			activities: []discord.Activity{{
				Name: "something",
				Type: discord.ActivityTypeStreaming,
				URL:  omit.Ptr("https://twitch.tv/x"),
			}},
		},
		{
			name: "an activity type without a name is dropped",
			customBot: model.CustomBot{
				GatewayStatus:       "online",
				GatewayActivityType: null.IntFrom(2),
			},
			status: discord.OnlineStatusOnline,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data := presenceConfigFromCustomBot(&tt.customBot).data()

			if data.Status != tt.status {
				t.Errorf("status = %v, want %v", data.Status, tt.status)
			}
			if !reflect.DeepEqual(data.Activities, tt.activities) {
				t.Errorf("activities = %+v, want %+v", data.Activities, tt.activities)
			}
		})
	}
}

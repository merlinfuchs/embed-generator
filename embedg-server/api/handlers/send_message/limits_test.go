package send_message

import (
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

func TestCheckPlanLimits(t *testing.T) {
	features := model.PlanFeatures{MaxActionsPerComponent: 2}

	tests := []struct {
		name string
		data actions.MessageWithActions
		ok   bool
	}{
		{
			name: "within the action limit",
			data: actions.MessageWithActions{Actions: map[string]actions.ActionSet{"a": {Actions: make([]actions.Action, 2)}}},
			ok:   true,
		},
		{
			name: "over the action limit",
			data: actions.MessageWithActions{Actions: map[string]actions.ActionSet{"a": {Actions: make([]actions.Action, 3)}}},
		},
		{
			name: "components v2 without the feature",
			data: actions.MessageWithActions{Flags: discord.MessageFlagIsComponentsV2},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := checkPlanLimits(&tt.data, features)
			if (err == nil) != tt.ok {
				t.Fatalf("want ok=%v, got %v", tt.ok, err)
			}
		})
	}
}

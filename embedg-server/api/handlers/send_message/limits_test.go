package send_message

import (
	"testing"

	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

func TestCheckMessageLimits(t *testing.T) {
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
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := checkMessageLimits(&tt.data, features)
			if (err == nil) != tt.ok {
				t.Fatalf("want ok=%v, got %v", tt.ok, err)
			}
		})
	}
}

func TestCheckMessageLimitsResponseMessages(t *testing.T) {
	premium := model.PlanFeatures{MaxActionsPerComponent: 2, AdvancedActionTypes: true}
	free := model.PlanFeatures{MaxActionsPerComponent: 2}
	message := &actions.MessageWithActions{Content: "hi"}

	tests := []struct {
		name     string
		action   actions.Action
		features model.PlanFeatures
		ok       bool
	}{
		{name: "saved message", action: actions.Action{Type: actions.ActionTypeSavedMessageResponse, TargetID: "1"}, features: free, ok: true},
		{name: "own message", action: actions.Action{Type: actions.ActionTypeSavedMessageDM, Message: message}, features: premium, ok: true},
		{name: "own message to another channel", action: actions.Action{Type: actions.ActionTypeSavedMessageChannel, ChannelID: "1", Message: message}, features: premium, ok: true},
		{name: "own message without premium", action: actions.Action{Type: actions.ActionTypeSavedMessageEdit, Message: message}, features: free},
		{name: "own message and saved message", action: actions.Action{Type: actions.ActionTypeSavedMessageResponse, TargetID: "1", Message: message}, features: premium},
		{name: "own message on a text response", action: actions.Action{Type: actions.ActionTypeTextResponse, Message: message}, features: premium},
		{name: "invalid own message", action: actions.Action{Type: actions.ActionTypeSavedMessageResponse, Message: &actions.MessageWithActions{}}, features: premium},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data := actions.MessageWithActions{Actions: map[string]actions.ActionSet{"a": {Actions: []actions.Action{tt.action}}}}
			err := checkMessageLimits(&data, tt.features)
			if (err == nil) != tt.ok {
				t.Fatalf("want ok=%v, got %v", tt.ok, err)
			}
		})
	}
}

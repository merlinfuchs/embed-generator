package handlers

import (
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

func CheckActionSetLimit(actionSet actions.ActionSet, features model.PlanFeatures) error {
	if len(actionSet.Actions) > features.MaxActionsPerComponent {
		return Forbidden("insufficient_plan", fmt.Sprintf("Your plan allows up to %d actions per component!", features.MaxActionsPerComponent))
	}
	return CheckActionMessages(actionSet, features)
}

// CheckActionMessages checks the response messages that actions carry themselves instead of naming
// a saved message. They take a plan with advanced action types. That's checked when they're saved,
// not when they run, so messages that are already out keep working when the plan ends.
func CheckActionMessages(actionSet actions.ActionSet, features model.PlanFeatures) error {
	for i, action := range actionSet.Actions {
		if action.Message == nil {
			continue
		}

		switch action.Type {
		case actions.ActionTypeSavedMessageResponse, actions.ActionTypeSavedMessageDM, actions.ActionTypeSavedMessageEdit, actions.ActionTypeSavedMessageChannel:
		default:
			return BadRequest("invalid_actions", fmt.Sprintf("Action %d can't have a response message.", i+1))
		}
		if action.TargetID != "" {
			return BadRequest("invalid_actions", fmt.Sprintf("Action %d has both a saved message and a response message of its own.", i+1))
		}
		if !features.AdvancedActionTypes {
			return Forbidden("insufficient_plan", "Building the response message in the action needs premium. Respond with a saved message instead.")
		}
		if err := actions.CheckResponseMessage(action.Message); err != nil {
			return BadRequest("invalid_actions", fmt.Sprintf("The response message of action %d is invalid: %v.", i+1, err))
		}
	}
	return nil
}

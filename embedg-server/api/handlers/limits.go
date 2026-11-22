package handlers

import (
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/forward"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

// CheckActionSetLimit checks the actions of a component or command.
func CheckActionSetLimit(actionSet actions.ActionSet, features model.PlanFeatures) error {
	if err := checkActionCount(actionSet, features); err != nil {
		return err
	}
	if err := CheckComponentActions(actionSet); err != nil {
		return err
	}
	return CheckActionMessages(actionSet, features)
}

// CheckFormActionSetLimit checks the actions that run when a form is submitted.
func CheckFormActionSetLimit(actionSet actions.ActionSet, features model.PlanFeatures) error {
	if err := checkActionCount(actionSet, features); err != nil {
		return err
	}
	if err := actions.ValidateFormActionSet(actionSet); err != nil {
		return BadRequest("invalid_actions", fmt.Sprintf("Invalid actions: %s.", err))
	}
	if err := checkForwardActions(actionSet, features); err != nil {
		return err
	}
	return CheckActionMessages(actionSet, features)
}

func checkActionCount(actionSet actions.ActionSet, features model.PlanFeatures) error {
	if len(actionSet.Actions) > features.MaxActionsPerComponent {
		return Forbidden("insufficient_plan", fmt.Sprintf("Your plan allows up to %d actions per component!", features.MaxActionsPerComponent))
	}
	return nil
}

// CheckComponentActions checks that a Show Form action can open its form when it runs, and that
// there are no actions only a form can have.
func CheckComponentActions(actionSet actions.ActionSet) error {
	if err := actions.ValidateShowFormPlacement(actionSet); err != nil {
		return BadRequest("invalid_actions", fmt.Sprintf("Invalid actions: %s.", err))
	}
	if err := actions.ValidateComponentActionSet(actionSet); err != nil {
		return BadRequest("invalid_actions", fmt.Sprintf("Invalid actions: %s.", err))
	}
	return nil
}

// checkForwardActions checks the URLs that a form's answers are sent to. Sending them takes a plan
// with advanced action types.
func checkForwardActions(actionSet actions.ActionSet, features model.PlanFeatures) error {
	for i, action := range actionSet.Actions {
		if action.Type != actions.ActionTypeForwardForm {
			continue
		}
		if !features.AdvancedActionTypes {
			return Forbidden("insufficient_plan", "Sending form answers to a URL needs premium.")
		}
		if err := forward.ValidateURL(action.Text); err != nil {
			return BadRequest("invalid_actions", fmt.Sprintf("Invalid URL in action %d: %s.", i+1, err))
		}
	}
	return nil
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

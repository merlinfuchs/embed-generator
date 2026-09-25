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
	return nil
}

package model

import (
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
)

// Form is a modal that members fill in. Opening it is an action of a component or command,
// submitting it runs Actions with the submitted text available to templates.
type Form struct {
	ID      string
	GuildID common.ID
	// Name is how the form is called in the dashboard and in the action that opens it.
	Name string
	// Title is shown at the top of the modal in Discord.
	Title   string
	Fields  []actions.FormField
	Actions actions.ActionSet
	// DerivedPermissions are what the user who last saved the form may do with its actions.
	DerivedPermissions *actions.ActionDerivedPermissions
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

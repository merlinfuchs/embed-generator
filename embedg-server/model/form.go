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
	// SigningSecret signs the answers that the form's actions send to a URL, so the receiver can
	// check they come from us. Forms saved before it existed get one the next time they're saved.
	SigningSecret string
	// ForwardError is why the last answers couldn't be sent to a URL, empty when they could.
	ForwardError   string
	ForwardErrorAt time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

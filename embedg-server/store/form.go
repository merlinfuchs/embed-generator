package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

type FormStore interface {
	GetForms(ctx context.Context, guildID common.ID) ([]model.Form, error)
	GetForm(ctx context.Context, guildID common.ID, id string) (*model.Form, error)
	CountForms(ctx context.Context, guildID common.ID) (int64, error)
	CreateForm(ctx context.Context, form model.Form) (*model.Form, error)
	UpdateForm(ctx context.Context, form model.Form) (*model.Form, error)
	DeleteForm(ctx context.Context, guildID common.ID, id string) (*model.Form, error)
	// SetFormForwardError records why a form's answers couldn't be sent to a URL. An empty message
	// clears it.
	SetFormForwardError(ctx context.Context, guildID common.ID, id string, message string, at time.Time) error
	// IncrementFormForwardCount counts a form submission that's sent to a URL in the window that
	// starts at windowStart, and returns how many the guild has sent in it.
	IncrementFormForwardCount(ctx context.Context, guildID common.ID, windowStart time.Time) (int, error)
}

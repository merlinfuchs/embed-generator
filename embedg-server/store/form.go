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
	// SetFormForwardError records why a form's answers couldn't be sent to a URL, or clears it when
	// message is empty. startedAt is when the send started. It's ignored when a later send or a save
	// already recorded its result, so sends that finish out of order don't undo each other.
	SetFormForwardError(ctx context.Context, guildID common.ID, id string, message string, startedAt time.Time) error
}

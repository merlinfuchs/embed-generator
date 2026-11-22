package store

import (
	"context"

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
}

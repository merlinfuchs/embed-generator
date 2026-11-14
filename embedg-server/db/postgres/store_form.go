package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

var _ store.FormStore = (*Client)(nil)

func (c *Client) GetForms(ctx context.Context, guildID common.ID) ([]model.Form, error) {
	rows, err := c.Q.GetForms(ctx, guildID.String())
	if err != nil {
		return nil, err
	}

	forms := make([]model.Form, len(rows))
	for i, row := range rows {
		form, err := rowToForm(row)
		if err != nil {
			return nil, err
		}
		forms[i] = *form
	}
	return forms, nil
}

func (c *Client) GetForm(ctx context.Context, guildID common.ID, id string) (*model.Form, error) {
	row, err := c.Q.GetForm(ctx, pgmodel.GetFormParams{
		ID:      id,
		GuildID: guildID.String(),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToForm(row)
}

func (c *Client) CountForms(ctx context.Context, guildID common.ID) (int64, error) {
	return c.Q.CountForms(ctx, guildID.String())
}

func (c *Client) CreateForm(ctx context.Context, form model.Form) (*model.Form, error) {
	rawFields, rawActions, rawDerivedPermissions, err := marshalFormJSON(form)
	if err != nil {
		return nil, err
	}

	row, err := c.Q.InsertForm(ctx, pgmodel.InsertFormParams{
		ID:                 form.ID,
		GuildID:            form.GuildID.String(),
		Name:               form.Name,
		Title:              form.Title,
		Fields:             rawFields,
		Actions:            rawActions,
		DerivedPermissions: rawDerivedPermissions,
		CreatedAt:          pgtype.Timestamp{Time: form.CreatedAt, Valid: true},
		UpdatedAt:          pgtype.Timestamp{Time: form.UpdatedAt, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	return rowToForm(row)
}

func (c *Client) UpdateForm(ctx context.Context, form model.Form) (*model.Form, error) {
	rawFields, rawActions, rawDerivedPermissions, err := marshalFormJSON(form)
	if err != nil {
		return nil, err
	}

	row, err := c.Q.UpdateForm(ctx, pgmodel.UpdateFormParams{
		ID:                 form.ID,
		GuildID:            form.GuildID.String(),
		Name:               form.Name,
		Title:              form.Title,
		Fields:             rawFields,
		Actions:            rawActions,
		DerivedPermissions: rawDerivedPermissions,
		UpdatedAt:          pgtype.Timestamp{Time: form.UpdatedAt, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToForm(row)
}

func (c *Client) DeleteForm(ctx context.Context, guildID common.ID, id string) (*model.Form, error) {
	row, err := c.Q.DeleteForm(ctx, pgmodel.DeleteFormParams{
		ID:      id,
		GuildID: guildID.String(),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToForm(row)
}

func marshalFormJSON(form model.Form) (fields []byte, acts []byte, derivedPermissions []byte, err error) {
	fields, err = json.Marshal(form.Fields)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to marshal fields: %w", err)
	}

	acts, err = json.Marshal(form.Actions)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to marshal actions: %w", err)
	}

	derivedPermissions, err = json.Marshal(form.DerivedPermissions)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to marshal derived permissions: %w", err)
	}
	return fields, acts, derivedPermissions, nil
}

func rowToForm(row pgmodel.Form) (*model.Form, error) {
	var fields []actions.FormField
	if err := json.Unmarshal(row.Fields, &fields); err != nil {
		return nil, fmt.Errorf("failed to unmarshal fields: %w", err)
	}

	var acts actions.ActionSet
	if err := json.Unmarshal(row.Actions, &acts); err != nil {
		return nil, fmt.Errorf("failed to unmarshal actions: %w", err)
	}

	var derivedPermissions *actions.ActionDerivedPermissions
	if row.DerivedPermissions != nil {
		derivedPermissions = &actions.ActionDerivedPermissions{}
		if err := json.Unmarshal(row.DerivedPermissions, derivedPermissions); err != nil {
			return nil, fmt.Errorf("failed to unmarshal derived permissions: %w", err)
		}
	}

	return &model.Form{
		ID:                 row.ID,
		GuildID:            common.DefinitelyID(row.GuildID),
		Name:               row.Name,
		Title:              row.Title,
		Fields:             fields,
		Actions:            acts,
		DerivedPermissions: derivedPermissions,
		CreatedAt:          row.CreatedAt.Time,
		UpdatedAt:          row.UpdatedAt.Time,
	}, nil
}

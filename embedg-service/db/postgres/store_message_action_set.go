package postgres

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"gopkg.in/guregu/null.v4"
)

var _ store.MessageActionSetStore = (*Client)(nil)

func (c *Client) CreateMessageActionSet(ctx context.Context, messageActionSet model.MessageActionSet) (*model.MessageActionSet, error) {
	row, err := c.Q.InsertMessageActionSet(ctx, pgmodel.InsertMessageActionSetParams{
		ID:                 messageActionSet.ID,
		MessageID:          messageActionSet.MessageID.String(),
		SetID:              messageActionSet.SetID,
		Actions:            messageActionSet.Actions,
		DerivedPermissions: messageActionSet.DerivedPermissions,
		Ephemeral:          messageActionSet.Ephemeral,
	})
	if err != nil {
		return nil, err
	}
	return rowToMessageActionSet(row), nil
}

func (c *Client) GetMessageActionSet(ctx context.Context, messageID common.ID, actionSetID string) (*model.MessageActionSet, error) {
	row, err := c.Q.GetMessageActionSet(ctx, pgmodel.GetMessageActionSetParams{
		MessageID: messageID.String(),
		SetID:     actionSetID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}
	return rowToMessageActionSet(row), nil
}

func (c *Client) GetMessageActionSets(ctx context.Context, messageID common.ID) ([]model.MessageActionSet, error) {
	rows, err := c.Q.GetMessageActionSets(ctx, messageID.String())
	if err != nil {
		return nil, err
	}
	return rowsToMessageActionSets(rows), nil
}

func (c *Client) DeleteMessageActionSetsForMessage(ctx context.Context, messageID common.ID) error {
	err := c.Q.DeleteMessageActionSetsForMessage(ctx, messageID.String())
	return err
}

func rowsToMessageActionSets(rows []pgmodel.MessageActionSet) []model.MessageActionSet {
	sets := make([]model.MessageActionSet, len(rows))
	for i, row := range rows {
		sets[i] = *rowToMessageActionSet(row)
	}
	return sets
}

func rowToMessageActionSet(row pgmodel.MessageActionSet) *model.MessageActionSet {
	var actions json.RawMessage
	if row.Actions != nil {
		actions = json.RawMessage(row.Actions)
	}

	var derivedPermissions json.RawMessage
	if row.DerivedPermissions != nil {
		derivedPermissions = json.RawMessage(row.DerivedPermissions)
	}

	return &model.MessageActionSet{
		ID:                 row.ID,
		MessageID:          common.DefinitelyID(row.MessageID),
		SetID:              row.SetID,
		Actions:            actions,
		DerivedPermissions: derivedPermissions,
		LastUsedAt:         null.NewTime(row.LastUsedAt.Time, row.LastUsedAt.Valid),
		Ephemeral:          row.Ephemeral,
	}
}

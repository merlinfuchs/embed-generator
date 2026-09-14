package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	"gopkg.in/guregu/null.v4"
)

var _ store.MessageActionSetStore = (*Client)(nil)

func (c *Client) CreateMessageActionSet(ctx context.Context, messageActionSet model.MessageActionSet) (*model.MessageActionSet, error) {
	rawActions, err := json.Marshal(messageActionSet.Actions)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal actions: %w", err)
	}
	rawDerivedPermissions, err := json.Marshal(messageActionSet.DerivedPermissions)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal derived permissions: %w", err)
	}

	row, err := c.Q.InsertMessageActionSet(ctx, pgmodel.InsertMessageActionSetParams{
		ID:                 messageActionSet.ID,
		MessageID:          messageActionSet.MessageID.String(),
		SetID:              messageActionSet.SetID,
		Actions:            rawActions,
		DerivedPermissions: rawDerivedPermissions,
		Ephemeral:          messageActionSet.Ephemeral,
	})
	if err != nil {
		return nil, err
	}
	return rowToMessageActionSet(row)
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
	return rowToMessageActionSet(row)
}

func (c *Client) GetMessageActionSets(ctx context.Context, messageID common.ID) ([]model.MessageActionSet, error) {
	rows, err := c.Q.GetMessageActionSets(ctx, messageID.String())
	if err != nil {
		return nil, err
	}
	return rowsToMessageActionSets(rows)
}

func (c *Client) DeleteMessageActionSetsForMessage(ctx context.Context, messageID common.ID) error {
	err := c.Q.DeleteMessageActionSetsForMessage(ctx, messageID.String())
	return err
}

func rowsToMessageActionSets(rows []pgmodel.MessageActionSet) ([]model.MessageActionSet, error) {
	sets := make([]model.MessageActionSet, len(rows))
	for i, row := range rows {
		set, err := rowToMessageActionSet(row)
		if err != nil {
			return nil, err
		}
		sets[i] = *set
	}
	return sets, nil
}

func rowToMessageActionSet(row pgmodel.MessageActionSet) (*model.MessageActionSet, error) {
	var acts actions.ActionSet
	err := json.Unmarshal(row.Actions, &acts)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal actions: %w", err)
	}

	var derivedPermissions *actions.ActionDerivedPermissions
	if row.DerivedPermissions != nil {
		derivedPermissions = &actions.ActionDerivedPermissions{}
		err := json.Unmarshal(row.DerivedPermissions, derivedPermissions)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal derived permissions: %w", err)
		}
	}

	return &model.MessageActionSet{
		ID:                 row.ID,
		MessageID:          common.DefinitelyID(row.MessageID),
		SetID:              row.SetID,
		Actions:            acts,
		DerivedPermissions: derivedPermissions,
		LastUsedAt:         null.NewTime(row.LastUsedAt.Time, row.LastUsedAt.Valid),
		Ephemeral:          row.Ephemeral,
	}, nil
}

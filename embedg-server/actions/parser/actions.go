package parser

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"github.com/sqlc-dev/pqtype"
)

func (m *ActionParser) CreateActionsForMessage(ctx context.Context, actionSets map[string]actions.ActionSet, derivedPerms actions.ActionDerivedPermissions, messageID string, ephemeral bool) error {
	err := m.pg.Q.DeleteMessageActionSetsForMessage(ctx, messageID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to delete message action sets")
	}

	rawDerivedPerms, err := json.Marshal(derivedPerms)
	if err != nil {
		return fmt.Errorf("Failed to marshal permission context: %w", err)
	}

	for actionSetID, actionSet := range actionSets {
		raw, err := json.Marshal(actionSet)
		if err != nil {
			return err
		}

		_, err = m.pg.Q.InsertMessageActionSet(ctx, postgres.InsertMessageActionSetParams{
			ID:                 util.UniqueID(),
			MessageID:          messageID,
			SetID:              actionSetID,
			Actions:            raw,
			DerivedPermissions: pqtype.NullRawMessage{Valid: true, RawMessage: rawDerivedPerms},
			Ephemeral:          ephemeral,
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to insert message action set")
		}
	}
	return nil
}

func (m *ActionParser) RetrieveActionsForMessage(ctx context.Context, messageID string) (map[string]actions.ActionSet, error) {
	rows, err := m.pg.Q.GetMessageActionSets(ctx, messageID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get message action sets: %w", err)
	}

	res := make(map[string]actions.ActionSet, len(rows))

	for _, row := range rows {
		var set actions.ActionSet
		err := json.Unmarshal(row.Actions, &set)
		if err != nil {
			log.Error().Err(err).Msg("Failed to unmarshal action set")
		}

		res[row.SetID] = set
	}

	return res, nil
}

func (m *ActionParser) DeleteActionsForMessage(messageID string) error {
	return nil
}

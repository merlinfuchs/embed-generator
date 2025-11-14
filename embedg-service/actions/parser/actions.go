package parser

import (
	"context"
	"fmt"

	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/rs/zerolog/log"
)

func (m *ActionParser) CreateActionsForMessage(ctx context.Context, actionSets map[string]actions.ActionSet, derivedPerms actions.ActionDerivedPermissions, messageID common.ID, ephemeral bool) error {
	err := m.actionSetStore.DeleteMessageActionSetsForMessage(ctx, messageID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to delete message action sets")
	}

	for actionSetID, actionSet := range actionSets {
		_, err = m.actionSetStore.CreateMessageActionSet(ctx, model.MessageActionSet{
			ID:                 util.UniqueID(),
			MessageID:          messageID,
			SetID:              actionSetID,
			Actions:            actionSet,
			DerivedPermissions: &derivedPerms,
			Ephemeral:          ephemeral,
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to insert message action set")
		}
	}
	return nil
}

func (m *ActionParser) RetrieveActionsForMessage(ctx context.Context, messageID common.ID) (map[string]actions.ActionSet, error) {
	rows, err := m.actionSetStore.GetMessageActionSets(ctx, messageID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get message action sets: %w", err)
	}

	res := make(map[string]actions.ActionSet, len(rows))

	for _, row := range rows {
		res[row.SetID] = row.Actions
	}

	return res, nil
}

func (m *ActionParser) DeleteActionsForMessage(ctx context.Context, messageID common.ID) error {
	return m.actionSetStore.DeleteMessageActionSetsForMessage(ctx, messageID)
}

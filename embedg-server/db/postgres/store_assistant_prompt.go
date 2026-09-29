package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

var _ store.AssistantPromptStore = (*Client)(nil)

func (c *Client) CreateAssistantPrompt(ctx context.Context, prompt model.AssistantPrompt) error {
	return c.Q.InsertAssistantPrompt(ctx, pgmodel.InsertAssistantPromptParams{
		ID:                prompt.ID,
		GuildID:           prompt.GuildID.String(),
		UserID:            prompt.UserID.String(),
		Model:             prompt.Model,
		Prompt:            prompt.Prompt,
		Edited:            prompt.Edited,
		Rounds:            int32(prompt.Rounds),
		InputTokens:       int32(prompt.Usage.InputTokens),
		CachedInputTokens: int32(prompt.Usage.CachedInputTokens),
		OutputTokens:      int32(prompt.Usage.OutputTokens),
		CreatedAt:         pgtype.Timestamp{Time: prompt.CreatedAt, Valid: true},
		UpdatedAt:         pgtype.Timestamp{Time: prompt.UpdatedAt, Valid: true},
	})
}

func (c *Client) GetAssistantPrompt(ctx context.Context, guildID common.ID, id string) (*model.AssistantPrompt, error) {
	row, err := c.Q.GetAssistantPrompt(ctx, pgmodel.GetAssistantPromptParams{
		ID:      id,
		GuildID: guildID.String(),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, store.ErrNotFound
		}
		return nil, err
	}

	return rowToAssistantPrompt(row), nil
}

func (c *Client) DeleteAssistantPrompt(ctx context.Context, guildID common.ID, id string) error {
	return c.Q.DeleteAssistantPrompt(ctx, pgmodel.DeleteAssistantPromptParams{
		ID:      id,
		GuildID: guildID.String(),
	})
}

func (c *Client) StartAssistantPromptRound(ctx context.Context, guildID common.ID, id string, maxRounds int, updatedAt time.Time) (bool, error) {
	rows, err := c.Q.StartAssistantPromptRound(ctx, pgmodel.StartAssistantPromptRoundParams{
		ID:        id,
		GuildID:   guildID.String(),
		MaxRounds: int32(maxRounds),
		UpdatedAt: pgtype.Timestamp{Time: updatedAt, Valid: true},
	})
	return rows > 0, err
}

func (c *Client) AddAssistantPromptUsage(ctx context.Context, guildID common.ID, id string, usage model.AssistantUsage, edited bool, updatedAt time.Time) error {
	return c.Q.AddAssistantPromptUsage(ctx, pgmodel.AddAssistantPromptUsageParams{
		Edited:            edited,
		ID:                id,
		GuildID:           guildID.String(),
		InputTokens:       int32(usage.InputTokens),
		CachedInputTokens: int32(usage.CachedInputTokens),
		OutputTokens:      int32(usage.OutputTokens),
		UpdatedAt:         pgtype.Timestamp{Time: updatedAt, Valid: true},
	})
}

func (c *Client) CountAssistantPromptsSince(ctx context.Context, guildID common.ID, start time.Time) (model.AssistantPromptCount, error) {
	row, err := c.Q.CountAssistantPromptsSince(ctx, pgmodel.CountAssistantPromptsSinceParams{
		GuildID: guildID.String(),
		StartAt: pgtype.Timestamp{Time: start, Valid: true},
	})
	return model.AssistantPromptCount{Edited: int(row.Edited), Total: int(row.Total)}, err
}

func rowToAssistantPrompt(row pgmodel.AssistantPrompt) *model.AssistantPrompt {
	return &model.AssistantPrompt{
		ID:      row.ID,
		GuildID: common.DefinitelyID(row.GuildID),
		UserID:  common.DefinitelyID(row.UserID),
		Model:   row.Model,
		Prompt:  row.Prompt,
		Edited:  row.Edited,
		Rounds:  int(row.Rounds),
		Usage: model.AssistantUsage{
			InputTokens:       int(row.InputTokens),
			CachedInputTokens: int(row.CachedInputTokens),
			OutputTokens:      int(row.OutputTokens),
		},
		CreatedAt: row.CreatedAt.Time,
		UpdatedAt: row.UpdatedAt.Time,
	}
}

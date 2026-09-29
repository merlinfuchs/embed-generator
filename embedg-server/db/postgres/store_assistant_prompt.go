package postgres

import (
	"context"
	"time"

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

func (c *Client) DeleteAssistantPrompt(ctx context.Context, guildID common.ID, id string) error {
	return c.Q.DeleteAssistantPrompt(ctx, pgmodel.DeleteAssistantPromptParams{
		ID:      id,
		GuildID: guildID.String(),
	})
}

func (c *Client) FinishAssistantPrompt(ctx context.Context, prompt model.AssistantPrompt) error {
	return c.Q.FinishAssistantPrompt(ctx, pgmodel.FinishAssistantPromptParams{
		Edited:            prompt.Edited,
		Rounds:            int32(prompt.Rounds),
		ID:                prompt.ID,
		GuildID:           prompt.GuildID.String(),
		InputTokens:       int32(prompt.Usage.InputTokens),
		CachedInputTokens: int32(prompt.Usage.CachedInputTokens),
		OutputTokens:      int32(prompt.Usage.OutputTokens),
		UpdatedAt:         pgtype.Timestamp{Time: prompt.UpdatedAt, Valid: true},
	})
}

func (c *Client) CountAssistantPromptsSince(ctx context.Context, guildID common.ID, start time.Time) (model.AssistantPromptCount, error) {
	row, err := c.Q.CountAssistantPromptsSince(ctx, pgmodel.CountAssistantPromptsSinceParams{
		GuildID: guildID.String(),
		StartAt: pgtype.Timestamp{Time: start, Valid: true},
	})
	return model.AssistantPromptCount{Edited: int(row.Edited), Total: int(row.Total)}, err
}

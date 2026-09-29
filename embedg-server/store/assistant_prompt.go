package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

type AssistantPromptStore interface {
	CreateAssistantPrompt(ctx context.Context, prompt model.AssistantPrompt) error
	DeleteAssistantPrompt(ctx context.Context, guildID common.ID, id string) error
	// FinishAssistantPrompt records the model calls made for the prompt, their usage, and whether
	// the answer changed the message.
	FinishAssistantPrompt(ctx context.Context, prompt model.AssistantPrompt) error
	CountAssistantPromptsSince(ctx context.Context, guildID common.ID, start time.Time) (model.AssistantPromptCount, error)
}

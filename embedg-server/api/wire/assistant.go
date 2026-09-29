package wire

import (
	"errors"

	validation "github.com/go-ozzo/ozzo-validation/v4"
)

type AssistantChatMessageWire struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func (m AssistantChatMessageWire) Validate() error {
	return validation.ValidateStruct(&m,
		validation.Field(&m.Role, validation.Required, validation.In("user", "assistant")),
		// The assistant can answer with a message alone.
		validation.Field(&m.Content, validation.When(m.Role == "user", validation.Required), validation.Length(0, 4000)),
	)
}

type AssistantChatRequestWire struct {
	// Message is the message in the editor as JSON.
	Message  string                     `json:"message"`
	Messages []AssistantChatMessageWire `json:"messages"`
	// RepairPromptID asks to fix the issues the editor found with the message of an earlier
	// prompt. Repairs don't count as new prompts.
	RepairPromptID string   `json:"repair_prompt_id"`
	Issues         []string `json:"issues"`
}

func (req AssistantChatRequestWire) Validate() error {
	err := validation.ValidateStruct(&req,
		validation.Field(&req.Message, validation.Required, validation.Length(1, 100_000)),
		validation.Field(&req.Messages, validation.Required, validation.Length(1, 20)),
		validation.Field(&req.Issues,
			validation.When(req.RepairPromptID != "", validation.Required).Else(validation.Empty),
			validation.Length(0, 50),
			validation.Each(validation.Length(1, 2000)),
		),
	)
	if err != nil {
		return err
	}

	// A repair follows the answer it fixes, anything else asks something new.
	lastRole := req.Messages[len(req.Messages)-1].Role
	if req.RepairPromptID == "" && lastRole != "user" {
		return validation.Errors{"messages": errors.New("the last message must be from the user")}
	}
	if req.RepairPromptID != "" && lastRole != "assistant" {
		return validation.Errors{"messages": errors.New("the last message of a repair must be from the assistant")}
	}
	return nil
}

type AssistantChatResponseDataWire struct {
	PromptID string `json:"prompt_id"`
	// Message is Markdown.
	Message string `json:"message"`
	// Data is the new message as JSON, or empty if the answer doesn't change it.
	Data string `json:"data"`
	// BuildPrompt is a request the user can send to make the change the message suggests, if
	// any.
	BuildPrompt string `json:"build_prompt"`
	// Fields ask the user for what the assistant needs but only they know.
	Fields []AssistantFieldWire `json:"fields"`
	// Issues are problems with the message the editor can't see. They are fixed with a repair,
	// like the problems the editor finds.
	Issues []string           `json:"issues"`
	Usage  AssistantUsageWire `json:"usage"`
}

type AssistantChatResponseWire APIResponse[AssistantChatResponseDataWire]

type AssistantUsageWire struct {
	PromptsUsed  int `json:"prompts_used"`
	PromptsLimit int `json:"prompts_limit"`
}

type AssistantUsageResponseWire APIResponse[AssistantUsageWire]

// AssistantFieldWire asks the user for something only they know, like a channel.
type AssistantFieldWire struct {
	Label       string `json:"label"`
	Description string `json:"description"`
	// Type is "text", "channel", "role" or "choice".
	Type    string   `json:"type"`
	Options []string `json:"options"`
	Default string   `json:"default"`
}

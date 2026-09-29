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
}

func (req AssistantChatRequestWire) Validate() error {
	err := validation.ValidateStruct(&req,
		validation.Field(&req.Message, validation.Required, validation.Length(1, 100_000)),
		validation.Field(&req.Messages, validation.Required, validation.Length(1, 20)),
	)
	if err != nil {
		return err
	}

	if req.Messages[len(req.Messages)-1].Role != "user" {
		return validation.Errors{"messages": errors.New("the last message must be from the user")}
	}
	return nil
}

type AssistantChatResponseDataWire struct {
	// Message is Markdown.
	Message string `json:"message"`
	// Data is the new message as JSON, or empty if the answer doesn't change it.
	Data string `json:"data"`
	// BuildPrompt is a request the user can send to make the change the message suggests, if
	// any.
	BuildPrompt string `json:"build_prompt"`
	// Fields ask the user for what the assistant needs but only they know.
	Fields []AssistantFieldWire `json:"fields"`
	// Issues are problems with the message the editor can't see, like roles the guild doesn't
	// have, that the assistant couldn't fix.
	Issues []string `json:"issues"`
	// Repairs is how often the assistant fixed its own message.
	Repairs int                `json:"repairs"`
	Usage   AssistantUsageWire `json:"usage"`
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

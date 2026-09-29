package assistant

// outputSchema is the shape of the model's answer. It isn't strict, as a strict schema of the
// message would need every one of its many optional fields set. The message is still a JSON object
// rather than JSON in a string, which the model often got the braces of wrong in.
var outputSchema = map[string]any{
	"type":                 "object",
	"additionalProperties": false,
	"required":             []string{"reply", "new_message", "fields", "build_prompt"},
	"properties": map[string]any{
		"reply": map[string]any{
			"type":        "string",
			"description": "Answer to the user in the chat, in Markdown.",
		},
		"new_message": map[string]any{
			"type":        []string{"object", "null"},
			"description": "When changing the message: the whole new message. Null otherwise.",
		},
		"fields": map[string]any{
			"type":        "array",
			"description": "When asking for something only the user knows: inputs for it, at most 4. Empty otherwise.",
			"items": map[string]any{
				"type":                 "object",
				"additionalProperties": false,
				"required":             []string{"label", "description", "type", "options", "default"},
				"properties": map[string]any{
					"label":       map[string]any{"type": "string"},
					"description": map[string]any{"type": "string"},
					"type": map[string]any{
						"type": "string",
						"enum": []string{"text", "channel", "role", "choice"},
					},
					"options": map[string]any{
						"type":        "array",
						"items":       map[string]any{"type": "string"},
						"description": "choice: the answers to pick from. Empty otherwise.",
					},
					"default": map[string]any{
						"type":        "string",
						"description": "A suggested value, or empty.",
					},
				},
			},
		},
		"build_prompt": map[string]any{
			"type":        []string{"string", "null"},
			"description": "When answering without changes and suggesting one: the request to make it, in the user's words.",
		},
	},
}

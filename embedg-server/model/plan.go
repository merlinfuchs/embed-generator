package model

type Plan struct {
	ID         string       `toml:"id"`
	SKUID      string       `toml:"sku_id"`
	Default    bool         `toml:"default"`
	Features   PlanFeatures `toml:"features"`
	Consumable bool         `toml:"consumable"`
}

type PlanFeatures struct {
	MaxSavedMessages          int  `toml:"max_saved_messages"`
	MaxActionsPerComponent    int  `toml:"max_actions_per_component"`
	AdvancedActionTypes       bool `toml:"advanced_action_types"`
	CustomBot                 bool `toml:"custom_bot"`
	MaxCustomCommands         int  `toml:"max_custom_commands"`
	IsPremium                 bool `toml:"is_premium"`
	MaxImageUploadSize        int  `toml:"max_image_upload_size"`
	MaxScheduledMessages      int  `toml:"max_scheduled_messages"`
	PeriodicScheduledMessages bool `toml:"periodic_scheduled_messages"`
	MaxTemplateOps            int  `toml:"max_template_ops"`
	MaxKVKeys                 int  `toml:"max_kv_keys"`
	// MaxAIPromptsPerMonth is how many prompts that change the message the AI assistant takes a
	// month. 0 turns it off.
	MaxAIPromptsPerMonth int `toml:"max_ai_prompts_per_month"`
	// MaxSavedMessageVersions is how many earlier versions are kept of each saved message when it's
	// overwritten. 0 turns it off.
	MaxSavedMessageVersions int `toml:"max_saved_message_versions"`
}

func (f *PlanFeatures) Merge(b PlanFeatures) {
	if b.MaxSavedMessages > f.MaxSavedMessages {
		f.MaxSavedMessages = b.MaxSavedMessages
	}
	if b.MaxSavedMessageVersions > f.MaxSavedMessageVersions {
		f.MaxSavedMessageVersions = b.MaxSavedMessageVersions
	}
	if b.MaxActionsPerComponent > f.MaxActionsPerComponent {
		f.MaxActionsPerComponent = b.MaxActionsPerComponent
	}
	if b.MaxCustomCommands > f.MaxCustomCommands {
		f.MaxCustomCommands = b.MaxCustomCommands
	}
	if b.MaxImageUploadSize > f.MaxImageUploadSize {
		f.MaxImageUploadSize = b.MaxImageUploadSize
	}
	if b.MaxScheduledMessages > f.MaxScheduledMessages {
		f.MaxScheduledMessages = b.MaxScheduledMessages
	}
	if b.MaxTemplateOps > f.MaxTemplateOps {
		f.MaxTemplateOps = b.MaxTemplateOps
	}
	if b.MaxKVKeys > f.MaxKVKeys {
		f.MaxKVKeys = b.MaxKVKeys
	}
	if b.MaxAIPromptsPerMonth > f.MaxAIPromptsPerMonth {
		f.MaxAIPromptsPerMonth = b.MaxAIPromptsPerMonth
	}

	f.AdvancedActionTypes = f.AdvancedActionTypes || b.AdvancedActionTypes
	f.IsPremium = f.IsPremium || b.IsPremium
	f.CustomBot = f.CustomBot || b.CustomBot
	f.PeriodicScheduledMessages = f.PeriodicScheduledMessages || b.PeriodicScheduledMessages
}

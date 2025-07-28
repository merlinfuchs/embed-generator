package model

type Plan struct {
	ID         string       `mapstructure:"id"`
	SKUID      string       `mapstructure:"sku_id"`
	Default    bool         `mapstructure:"default"`
	Features   PlanFeatures `mapstructure:"features"`
	Consumable bool         `mapstructure:"consumable"`
}

type PlanFeatures struct {
	MaxSavedMessages          int   `mapstructure:"max_saved_messages"`
	MaxActionsPerComponent    int   `mapstructure:"max_actions_per_component"`
	AdvancedActionTypes       bool  `mapstructure:"advanced_action_types"`
	AIAssistant               bool  `mapstructure:"ai_assistant"`
	CustomBot                 bool  `mapstructure:"custom_bot"`
	ComponentsV2              bool  `mapstructure:"components_v2"`
	ComponentTypes            []int `mapstructure:"component_types"`
	MaxCustomCommands         int   `mapstructure:"max_custom_commands"`
	IsPremium                 bool  `mapstructure:"is_premium"`
	MaxImageUploadSize        int   `mapstructure:"max_image_upload_size"`
	MaxScheduledMessages      int   `mapstructure:"max_scheduled_messages"`
	PeriodicScheduledMessages bool  `mapstructure:"periodic_scheduled_messages"`
	MaxTemplateOps            int   `mapstructure:"max_template_ops"`
	MaxKVKeys                 int   `mapstructure:"max_kv_keys"`
}

func (f *PlanFeatures) Merge(b PlanFeatures) {
	if b.MaxSavedMessages > f.MaxSavedMessages {
		f.MaxSavedMessages = b.MaxSavedMessages
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

	f.AdvancedActionTypes = f.AdvancedActionTypes || b.AdvancedActionTypes
	f.AIAssistant = f.AIAssistant || b.AIAssistant
	f.IsPremium = f.IsPremium || b.IsPremium
	f.CustomBot = f.CustomBot || b.CustomBot
	f.ComponentsV2 = f.ComponentsV2 || b.ComponentsV2
	f.ComponentTypes = mergeIntSlices(f.ComponentTypes, b.ComponentTypes)
	f.PeriodicScheduledMessages = f.PeriodicScheduledMessages || b.PeriodicScheduledMessages
}

func mergeIntSlices(a, b []int) []int {
	m := make(map[int]bool, len(a)+len(b))
	for _, v := range a {
		m[v] = true
	}
	for _, v := range b {
		m[v] = true
	}

	res := make([]int, 0, len(m))
	for k := range m {
		res = append(res, k)
	}

	return res
}

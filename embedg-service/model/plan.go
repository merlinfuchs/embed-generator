package model

import "github.com/merlinfuchs/embed-generator/embedg-service/common"

type Plan struct {
	ID         string       `toml:"id"`
	SKUID      common.ID    `toml:"sku_id"`
	Default    bool         `toml:"default"`
	Features   PlanFeatures `toml:"features"`
	Consumable bool         `toml:"consumable"`
}

type PlanFeatures struct {
	MaxSavedMessages          int   `toml:"max_saved_messages"`
	MaxActionsPerComponent    int   `toml:"max_actions_per_component"`
	AdvancedActionTypes       bool  `toml:"advanced_action_types"`
	AIAssistant               bool  `toml:"ai_assistant"`
	CustomBot                 bool  `toml:"custom_bot"`
	ComponentsV2              bool  `toml:"components_v2"`
	ComponentTypes            []int `toml:"component_types"`
	MaxCustomCommands         int   `toml:"max_custom_commands"`
	IsPremium                 bool  `toml:"is_premium"`
	MaxImageUploadSize        int   `toml:"max_image_upload_size"`
	MaxScheduledMessages      int   `toml:"max_scheduled_messages"`
	PeriodicScheduledMessages bool  `toml:"periodic_scheduled_messages"`
	MaxTemplateOps            int   `toml:"max_template_ops"`
	MaxKVKeys                 int   `toml:"max_kv_keys"`
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

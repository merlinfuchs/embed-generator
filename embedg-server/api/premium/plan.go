package premium

type Plan struct {
	ID       string       `mapstructure:"id"`
	SKUID    string       `mapstructure:"sku_id"`
	Default  bool         `mapstructure:"bool"`
	Features PlanFeatures `mapstructure:"features"`
}

type PlanFeatures struct {
	MaxSavedMessages       int  `mapstructure:"max_saved_messages"`
	MaxActionsPerComponent int  `mapstructure:"max_actions_per_component"`
	AdvancedActionTypes    bool `mapstructure:"advanced_action_types"`
	AIAssistant            bool `mapstructure:"ai_assistant"`
}

func (f *PlanFeatures) Merge(b PlanFeatures) {
	if b.MaxSavedMessages > f.MaxSavedMessages {
		f.MaxSavedMessages = b.MaxSavedMessages
	}
}

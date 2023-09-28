package premium

type Plan struct {
	ID       string       `mapstructure:"id"`
	SKUID    string       `mapstructure:"sku_id"`
	Default  bool         `mapstructure:"bool"`
	Features PlanFeatures `mapstructure:"features"`
}

type PlanFeatures struct {
	MaxSavedMessages int `mapstructure:"max_saved_messages" json:"max_saved_messages"`
}

func (f *PlanFeatures) Merge(b PlanFeatures) {
	if b.MaxSavedMessages > f.MaxSavedMessages {
		f.MaxSavedMessages = b.MaxSavedMessages
	}
}

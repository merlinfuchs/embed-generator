package wire

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation/v4"
	"gopkg.in/guregu/null.v4"
)

type GetPremiumPlanFeaturesResponseDataWire struct {
	MaxSavedMessages          int   `json:"max_saved_messages"`
	MaxActionsPerComponent    int   `json:"max_actions_per_component"`
	AdvancedActionTypes       bool  `json:"advanced_action_types"`
	AIAssistant               bool  `json:"ai_assistant"`
	ComponentsV2              bool  `json:"components_v2"`
	ComponentTypes            []int `json:"component_types"`
	CustomBot                 bool  `json:"custom_bot"`
	MaxCustomCommands         int   `json:"max_custom_commands"`
	IsPremium                 bool  `json:"is_premium"`
	MaxImageUploadSize        int   `json:"max_image_upload_size"`
	MaxScheduledMessages      int   `json:"max_scheduled_messages"`
	PeriodicScheduledMessages bool  `json:"periodic_scheduled_messages"`
	MaxTemplateOps            int   `json:"max_template_ops"`
	MaxKVKeys                 int   `json:"max_kv_keys"`
}

type GetPremiumPlanFeaturesResponseWire APIResponse[GetPremiumPlanFeaturesResponseDataWire]

type PremiumEntitlementWire struct {
	ID              string      `json:"id"`
	SkuID           string      `json:"sku_id"`
	UserID          null.String `json:"user_id"`
	GuildID         null.String `json:"guild_id"`
	UpdatedAt       time.Time   `json:"updated_at"`
	Deleted         bool        `json:"deleted"`
	StartsAt        null.Time   `json:"starts_at"`
	EndsAt          null.Time   `json:"ends_at"`
	Consumable      bool        `json:"consumable"`
	Consumed        bool        `json:"consumed"`
	ConsumedGuildID null.String `json:"consumed_guild_id"`
}

type ListPremiumEntitlementsResponseDataWire struct {
	Entitlements []PremiumEntitlementWire `json:"entitlements"`
}

type ListPremiumEntitlementsResponseWire APIResponse[ListPremiumEntitlementsResponseDataWire]

type ConsumeEntitlementRequestWire struct {
	GuildID string `json:"guild_id"`
}

func (req ConsumeEntitlementRequestWire) Validate() error {
	return validation.ValidateStruct(&req,
		validation.Field(&req.GuildID, validation.Required),
	)
}

type ConsumeEntitlementResponseWire APIResponse[struct{}]

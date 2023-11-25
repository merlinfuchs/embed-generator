package wire

import (
	"time"

	"gopkg.in/guregu/null.v4"
)

type GetPremiumPlanFeaturesResponseDataWire struct {
	MaxSavedMessages       int  `json:"max_saved_messages"`
	MaxActionsPerComponent int  `json:"max_actions_per_component"`
	AdvancedActionTypes    bool `json:"advanced_action_types"`
	AIAssistant            bool `json:"ai_assistant"`
	CustomBot              bool `json:"custom_bot"`
	MaxCustomCommands      int  `json:"max_custom_commands"`
	IsPremium              bool `json:"is_premium"`
	MaxImageUploadSize     int  `json:"max_image_upload_size"`
}

type GetPremiumPlanFeaturesResponseWire APIResponse[GetPremiumPlanFeaturesResponseDataWire]

type PremiumEntitlementWire struct {
	ID        string      `json:"id"`
	SkuID     string      `json:"sku_id"`
	UserID    null.String `json:"user_id"`
	GuildID   null.String `json:"guild_id"`
	UpdatedAt time.Time   `json:"updated_at"`
	Deleted   bool        `json:"deleted"`
	StartsAt  null.Time   `json:"starts_at"`
	EndsAt    null.Time   `json:"ends_at"`
}

type ListPremiumEntitlementsResponseDataWire struct {
	Entitlements []PremiumEntitlementWire `json:"entitlements"`
}

type ListPremiumEntitlementsResponseWire APIResponse[ListPremiumEntitlementsResponseDataWire]

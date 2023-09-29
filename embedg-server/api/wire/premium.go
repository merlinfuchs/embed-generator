package wire

import (
	"time"

	"gopkg.in/guregu/null.v4"
)

type GetPremiumPlanFeaturesResponseDataWire struct {
	MaxSavedMessages int `json:"max_saved_messages"`
}

type GetPremiumPlanFeaturesResponseWire APIResponse[GetPremiumPlanFeaturesResponseDataWire]

type PremiumEntitlementWire struct {
	ID        string      `json:"id"`
	SkuID     string      `json:"sku_id"`
	UserID    null.String `json:"user_id"`
	GuildID   null.String `json:"guild_id"`
	UpdatedAt time.Time   `json:"updated_at"`
	Deleted   bool        `json:"deleted"`
	StartsAt  time.Time   `json:"starts_at"`
	EndsAt    time.Time   `json:"ends_at"`
}

type ListPremiumEntitlementsResponseDataWire struct {
	Entitlements []PremiumEntitlementWire `json:"entitlements"`
}

type ListPremiumEntitlementsResponseWire APIResponse[ListPremiumEntitlementsResponseDataWire]

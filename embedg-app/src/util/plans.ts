import type { GetPremiumPlanFeaturesResponseDataWire } from "../api/wire";

export type Limit =
  | "max_saved_messages"
  | "max_saved_message_versions"
  | "max_scheduled_messages"
  | "max_custom_commands"
  | "max_actions_per_component"
  | "max_ai_prompts_per_month";

export interface PlanTier {
  name: "Premium" | "Ultimate";
  limits: Record<Limit, number>;
}

// Mirrors the paid plans in the production config.
export const premiumTier: PlanTier = {
  name: "Premium",
  limits: {
    max_saved_messages: 100,
    max_saved_message_versions: 25,
    max_scheduled_messages: 25,
    max_custom_commands: 25,
    max_actions_per_component: 10,
    max_ai_prompts_per_month: 100,
  },
};

export const ultimateTier: PlanTier = {
  name: "Ultimate",
  limits: {
    max_saved_messages: 500,
    max_saved_message_versions: 50,
    max_scheduled_messages: 100,
    max_custom_commands: 50,
    max_actions_per_component: 20,
    max_ai_prompts_per_month: 250,
  },
};

/**
 * The paid plans that raise the limit above what the features allow, cheapest
 * first. None while the features are unknown or already the highest plan.
 */
export function upgradesFor(
  limit: Limit,
  features: GetPremiumPlanFeaturesResponseDataWire | null,
) {
  if (!features || features.is_ultimate) return [];

  return [premiumTier, ultimateTier].filter(
    (t) => t.limits[limit] > features[limit],
  );
}

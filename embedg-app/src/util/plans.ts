import { usePremiumPlansQuery } from "../api/queries";
import type { GetPremiumPlanFeaturesResponseDataWire } from "../api/wire";

export type Limit =
  | "max_saved_messages"
  | "max_saved_message_versions"
  | "max_scheduled_messages"
  | "max_custom_commands"
  | "max_actions_per_component"
  | "max_ai_prompts_per_month";

// The names of the plans in the config that the app has copy for.
export const PREMIUM_PLAN = "Premium";
export const ULTIMATE_PLAN = "Ultimate";

/** The plans that can be bought, from the cheapest to the most expensive. */
export function usePlans() {
  const { data } = usePremiumPlansQuery();
  return data?.success ? data.data : null;
}

export function usePlan(name: string) {
  return usePlans()?.find((p) => p.plan === name);
}

/**
 * The plans that raise the limit above what the features allow, cheapest
 * first. None while either is unknown.
 */
export function upgradesFor(
  limit: Limit,
  features: GetPremiumPlanFeaturesResponseDataWire | null,
  plans: GetPremiumPlanFeaturesResponseDataWire[] | null,
) {
  if (!features || !plans) return [];

  return plans.filter((p) => p[limit] > features[limit]);
}

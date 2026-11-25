import { usePremiumPlansQuery } from "../api/queries";
import type { GetPremiumPlanFeaturesResponseDataWire } from "../api/wire";

export type Limit =
  | "max_saved_messages"
  | "max_saved_message_versions"
  | "max_scheduled_messages"
  | "max_forms"
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

/** Monthly prices per server in dollars. Set in Discord's store, so typed by hand. */
export const PLAN_PRICES: Record<string, string> = {
  [PREMIUM_PLAN]: "$4.99",
  [ULTIMATE_PLAN]: "$9.99",
};

/**
 * The limits of the free plan. The API only serves the paid plans, so these are
 * typed by hand and come from the prod config.
 */
export const FREE_LIMITS = {
  max_saved_messages: 25,
  max_scheduled_messages: 5,
  max_actions_per_component: 3,
  max_ai_prompts_per_month: 5,
  max_forms: 3,
};

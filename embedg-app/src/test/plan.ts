import type { GetPremiumPlanFeaturesResponseDataWire } from "../api/wire";

/** The default plan in embedg.example.toml. */
export const defaultPlanFeatures: GetPremiumPlanFeaturesResponseDataWire = {
  max_saved_messages: 25,
  max_saved_message_versions: 5,
  max_actions_per_component: 3,
  advanced_action_types: false,
  max_ai_prompts_per_month: 5,
  custom_bot: false,
  max_custom_commands: 0,
  is_premium: false,
  is_ultimate: false,
  max_image_upload_size: 0,
  max_scheduled_messages: 5,
  periodic_scheduled_messages: false,
  max_template_ops: 1000,
  max_kv_keys: 10,
};

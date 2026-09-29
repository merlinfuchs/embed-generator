import { expect, test } from "vitest";
import type { GetPremiumPlanFeaturesResponseDataWire } from "../api/wire";
import { messageSchema } from "./schema";
import { messageTemplates, templateAvailable, usesBot } from "./templates";

// The default plan in embedg.example.toml.
const defaultPlan: GetPremiumPlanFeaturesResponseDataWire = {
  max_saved_messages: 25,
  max_actions_per_component: 3,
  advanced_action_types: false,
  max_ai_prompts_per_month: 5,
  components_v2: true,
  component_types: [1, 2, 3, 9, 10, 11, 12, 17],
  custom_bot: false,
  max_custom_commands: 0,
  is_premium: false,
  max_image_upload_size: 0,
  max_scheduled_messages: 5,
  periodic_scheduled_messages: false,
  max_template_ops: 1000,
  max_kv_keys: 10,
};

test.each(messageTemplates)("$name is a valid message", (template) => {
  const result = messageSchema.safeParse(template.build());

  // Only the roles are left for the user to fill in.
  const issues = result.success ? [] : result.error.issues;
  expect(issues.filter((i) => i.path.at(-1) !== "target_id")).toEqual([]);
  if (!usesBot(template.build())) {
    expect(issues).toEqual([]);
  }
});

test("the role template makes the user pick the roles", () => {
  const roles = messageTemplates.find((t) => t.id === "roles");
  const result = messageSchema.safeParse(roles?.build());

  expect(result.success).toBe(false);
});

test("every build gets its own action sets", () => {
  const roles = messageTemplates.find((t) => t.id === "roles");
  const first = Object.keys(roles?.build().actions ?? {});
  const second = Object.keys(roles?.build().actions ?? {});

  expect(first).toHaveLength(3);
  expect(first.some((id) => second.includes(id))).toBe(false);
});

test("without a login only templates a webhook can send are offered", () => {
  const offered = messageTemplates.filter((t) =>
    templateAvailable(t.build(), null),
  );

  expect(offered.length).toBeGreaterThanOrEqual(5);
  for (const t of offered) {
    expect(t.build().components).toEqual([]);
  }
});

test("the default plan can send every template", () => {
  for (const t of messageTemplates) {
    expect(templateAvailable(t.build(), defaultPlan), t.id).toBe(true);
  }
});

test("a plan without Components V2 or a component type doesn't get them", () => {
  const withoutV2 = { ...defaultPlan, components_v2: false };
  expect(
    messageTemplates
      .filter((t) => templateAvailable(t.build(), withoutV2))
      .map((t) => t.id),
  ).not.toContain("v2-guide");

  const withoutSections = {
    ...defaultPlan,
    component_types: defaultPlan.component_types.filter((c) => c !== 9),
  };
  expect(
    messageTemplates
      .filter((t) => templateAvailable(t.build(), withoutSections))
      .map((t) => t.id),
  ).not.toContain("v2-guide");
});

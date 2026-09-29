import { beforeAll, expect, test, vi } from "vitest";
import { defaultPlanFeatures as defaultPlan } from "../test/plan";
import { messageSchema } from "./schema";
import { messageTemplates, templateAvailable } from "./templates";

// The banners link to the instance the app is served from.
beforeAll(() => {
  vi.stubGlobal("location", { origin: "https://message.style" });
});

test.each(messageTemplates)("$name is a valid message", (template) => {
  const result = messageSchema.safeParse(template.build());

  // Only the roles are left for the user to fill in.
  const issues = result.success ? [] : result.error.issues;
  expect(issues.filter((i) => i.path.at(-1) !== "target_id")).toEqual([]);
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

test("without a login everything but the templates that need the bot is offered", () => {
  const offered = messageTemplates
    .filter((t) => templateAvailable(t.build(), null))
    .map((t) => t.id);

  expect(offered).toContain("v2-guide");
  expect(offered).toContain("rules");
  expect(offered).not.toContain("roles");
});

test("the default plan can send every template", () => {
  for (const t of messageTemplates) {
    expect(templateAvailable(t.build(), defaultPlan), t.id).toBe(true);
  }
});

test("a plan with fewer actions per button than a template uses leaves it out", () => {
  const noActions = { ...defaultPlan, max_actions_per_component: 0 };

  expect(
    messageTemplates
      .filter((t) => templateAvailable(t.build(), noActions))
      .map((t) => t.id),
  ).not.toContain("roles");
});

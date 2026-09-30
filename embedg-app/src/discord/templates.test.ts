import { beforeAll, expect, test, vi } from "vitest";
import { defaultPlanFeatures as defaultPlan } from "../test/plan";
import { COMPONENTS_V2_FLAG, messageSchema } from "./schema";
import {
  messageTemplates,
  type TemplateFormat,
  templateAvailable,
} from "./templates";

// The banners link to the instance the app is served from.
beforeAll(() => {
  vi.stubGlobal("location", { origin: "https://message.style" });
});

const FORMATS: TemplateFormat[] = ["componentsV2", "embeds"];

const builds = messageTemplates.flatMap((template) =>
  FORMATS.map((format) => ({
    id: template.id,
    name: template.name,
    format,
    build: template.build[format],
  })),
);

const roles = messageTemplates.find((t) => t.id === "roles");

test.each(builds)("$name as $format is a valid message", ({ build }) => {
  const result = messageSchema.safeParse(build());

  // Only the roles are left for the user to fill in.
  const issues = result.success ? [] : result.error.issues;
  expect(issues.filter((i) => i.path.at(-1) !== "target_id")).toEqual([]);
});

test.each(builds)("$name as $format is in its format", ({ format, build }) => {
  const componentsV2 = ((build().flags ?? 0) & COMPONENTS_V2_FLAG) !== 0;

  expect(componentsV2).toBe(format === "componentsV2");
});

test.each(FORMATS)(
  "the role template as %s makes the user pick the roles",
  (format) => {
    const result = messageSchema.safeParse(roles?.build[format]());

    expect(result.success).toBe(false);
  },
);

test("every build gets its own action sets", () => {
  const first = Object.keys(roles?.build.embeds().actions ?? {});
  const second = Object.keys(roles?.build.embeds().actions ?? {});

  expect(first).toHaveLength(3);
  expect(first.some((id) => second.includes(id))).toBe(false);
});

test("without a login everything but the templates that need the bot is offered", () => {
  const offered = builds
    .filter(({ build }) => templateAvailable(build(), null))
    .map(({ id }) => id);

  expect(offered).toContain("welcome");
  expect(offered).toContain("rules");
  expect(offered).not.toContain("roles");
});

test("the default plan can send every template", () => {
  for (const { id, format, build } of builds) {
    expect(templateAvailable(build(), defaultPlan), `${id} ${format}`).toBe(
      true,
    );
  }
});

test("a plan with fewer actions per button than a template uses leaves it out", () => {
  const noActions = { ...defaultPlan, max_actions_per_component: 0 };

  expect(
    builds
      .filter(({ build }) => templateAvailable(build(), noActions))
      .map(({ id }) => id),
  ).not.toContain("roles");
});

import { beforeAll, expect, test, vi } from "vitest";
import { defaultPlanFeatures as defaultPlan } from "../test/plan";
import {
  COMPONENTS_V2_FLAG,
  type MessageComponent,
  messageSchema,
} from "./schema";
import {
  EMPTY_TEMPLATE_INPUT,
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
    build: () => template.build[format](EMPTY_TEMPLATE_INPUT),
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
    const result = messageSchema.safeParse(
      roles?.build[format](EMPTY_TEMPLATE_INPUT),
    );

    expect(result.success).toBe(false);
  },
);

test("every build gets its own action sets", () => {
  const first = Object.keys(
    roles?.build.embeds(EMPTY_TEMPLATE_INPUT).actions ?? {},
  );
  const second = Object.keys(
    roles?.build.embeds(EMPTY_TEMPLATE_INPUT).actions ?? {},
  );

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

const template = (id: string) => {
  const found = messageTemplates.find((t) => t.id === id);
  if (!found) throw new Error(`no template ${id}`);
  return found;
};

test.each(FORMATS)("picked roles end up in the actions as %s", (format) => {
  const message = template("roles").build[format]({
    values: { announcementsRole: "1", eventsRole: "2", giveawaysRole: "3" },
    guildId: "9",
  });

  const roleByLabel: Record<string, string> = {};
  const walk = (components: MessageComponent[]) => {
    for (const c of components) {
      if (c.type === 2 && c.style !== 5) {
        const action = message.actions[c.action_set_id].actions[0];
        if ("target_id" in action) roleByLabel[c.label] = action.target_id;
      }
      if ("components" in c) walk(c.components);
    }
  };
  walk(message.components);

  expect(roleByLabel).toEqual({
    Announcements: "1",
    Events: "2",
    Giveaways: "3",
  });
  expect(messageSchema.safeParse(message).success).toBe(true);
});

test("the fields of a template are the ones it reads", () => {
  expect(template("roles").fields?.map((f) => f.id)).toEqual([
    "announcementsRole",
    "eventsRole",
    "giveawaysRole",
  ]);
  expect(template("welcome").fields?.map((f) => f.type)).toEqual([
    "channel",
    "channel",
    "channel",
  ]);
});

test("picked channels become mentions, and links to them in Components V2", () => {
  const input = { values: { rulesChannel: "5" }, guildId: "9" };

  expect(JSON.stringify(template("welcome").build.embeds(input))).toContain(
    "<#5>",
  );
  expect(
    JSON.stringify(template("welcome").build.componentsV2(input)),
  ).toContain("https://discord.com/channels/9/5");
  expect(
    JSON.stringify(
      template("event").build.embeds({
        values: { eventChannel: "6" },
        guildId: "9",
      }),
    ),
  ).toContain("<#6>");
});

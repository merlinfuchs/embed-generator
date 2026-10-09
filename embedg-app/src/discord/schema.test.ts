import { expect, test } from "vitest";
import {
  COMPONENTS_V2_FLAG,
  embedImageUrlSchema,
  embedTextLength,
  embedTimestampSchema,
  messageActionSchema,
  messageSchema,
  unfurledMediaItemSchema,
} from "./schema";

function isValidMediaUrl(url: string) {
  return unfurledMediaItemSchema.safeParse({ url }).success;
}

test("an attachment reference is a valid url", () => {
  expect(isValidMediaUrl("attachment://image.png")).toBe(true);
  expect(embedImageUrlSchema.safeParse("attachment://image.png").success).toBe(
    true,
  );
  // Neither parses as a URL with a plausible hostname, so only the attachment
  // check lets them through.
  expect(isValidMediaUrl("attachment://clip.mp4")).toBe(true);
  expect(isValidMediaUrl("attachment://notes")).toBe(true);
});

test("an attachment reference needs a filename", () => {
  expect(isValidMediaUrl("attachment://")).toBe(false);
  expect(isValidMediaUrl("see attachment://clip.mp4")).toBe(false);
});

test("embed text counts what Discord counts towards its limit", () => {
  const embed = {
    title: "ab",
    description: "cde",
    url: "https://example.com",
    footer: { text: "f", icon_url: "https://example.com/icon.png" },
    author: { name: "gh" },
  };

  expect(embedTextLength(embed, [{ name: "i", value: "jk" }])).toBe(11);
});

function componentsV2Message(...lengths: number[]) {
  const [first, ...rest] = lengths;
  return {
    flags: COMPONENTS_V2_FLAG,
    components: [
      { type: 10, content: "a".repeat(first) },
      {
        type: 17,
        components: rest.map((length) => ({
          type: 9,
          components: [{ type: 10, content: "b".repeat(length) }],
          accessory: { type: 2, style: 5, label: "Open", url: "https://a.io" },
        })),
      },
    ],
  };
}

test("text displays can have 4000 characters in total", () => {
  expect(messageSchema.safeParse(componentsV2Message(2000, 2000)).success).toBe(
    true,
  );
});

test("every text display is flagged when they go over 4000 together", () => {
  const result = messageSchema.safeParse(componentsV2Message(2000, 1000, 1001));
  const issues = result.success ? [] : result.error.issues;

  expect(issues.map((issue) => issue.path)).toEqual([
    ["components", 0, "content"],
    ["components", 1, "components", 0, "components", 0, "content"],
    ["components", 1, "components", 1, "components", 0, "content"],
  ]);
  expect(issues[0].message).toContain("(currently 4001)");
});

function containersMessage(
  flags: number,
  containers: number,
  child: object = { type: 10, content: "a" },
) {
  return {
    flags,
    components: Array.from({ length: containers }, () => ({
      type: 17,
      components: [child],
    })),
  };
}

test("components v2 can have more than 5 top-level components", () => {
  // 7 containers with a text display each are 14 components.
  expect(
    messageSchema.safeParse(containersMessage(COMPONENTS_V2_FLAG, 7)).success,
  ).toBe(true);
});

test("components v2 can have 40 components, nested ones included", () => {
  expect(
    messageSchema.safeParse(containersMessage(COMPONENTS_V2_FLAG, 20)).success,
  ).toBe(true);

  const result = messageSchema.safeParse(
    containersMessage(COMPONENTS_V2_FLAG, 21),
  );
  const issues = result.success ? [] : result.error.issues;
  expect(issues.map((issue) => issue.path)).toEqual([["components"]]);
  expect(issues[0].message).toContain("(currently 42)");
});

test("accessories count towards the 40 components", () => {
  // Each container is 4 components with its section, text display and button.
  const section = {
    type: 9,
    components: [{ type: 10, content: "a" }],
    accessory: { type: 2, style: 5, label: "Open", url: "https://a.io" },
  };
  const message = (containers: number) =>
    containersMessage(COMPONENTS_V2_FLAG, containers, section);

  expect(messageSchema.safeParse(message(10)).success).toBe(true);
  expect(messageSchema.safeParse(message(11)).success).toBe(false);
});

test("a message without components v2 can have 5 action rows", () => {
  const row = {
    type: 1,
    components: [{ type: 2, style: 5, label: "Open", url: "https://a.io" }],
  };

  expect(
    messageSchema.safeParse({ components: Array(5).fill(row) }).success,
  ).toBe(true);
  expect(
    messageSchema.safeParse({ components: Array(6).fill(row) }).success,
  ).toBe(false);
});

function embedsMessage(...descriptionLengths: number[]) {
  return {
    embeds: descriptionLengths.map((length) => ({
      description: "a".repeat(length),
    })),
  };
}

test("embeds can have 6000 characters in total", () => {
  expect(messageSchema.safeParse(embedsMessage(4000, 2000)).success).toBe(true);
});

test("embeds going over 6000 characters together are flagged", () => {
  const result = messageSchema.safeParse(embedsMessage(4000, 2001));
  const issues = result.success ? [] : result.error.issues;

  expect(issues.map((issue) => issue.path)).toEqual([["embeds"]]);
  expect(issues[0].message).toContain("(currently 6001)");
});

test("embed timestamps must be dates the server can parse", () => {
  const valid = (v: string | undefined) =>
    embedTimestampSchema.safeParse(v).success;

  expect(valid(undefined)).toBe(true);
  expect(valid("2026-10-07T12:00:00.000Z")).toBe(true);
  expect(valid("2026-10-07T12:00:00+02:00")).toBe(true);
  expect(valid("2024-02-29T12:00:00Z")).toBe(true);

  // Each of these is rejected by Go's time.Parse(time.RFC3339).
  for (const v of [
    "",
    "tomorrow",
    "2026-10-07",
    "2026-10-07T12:00Z",
    "2026-10-07T12:00:00",
    "2026-10-07T12:00:00+0200",
    "2026-10-07T12:00:00+02",
    "2026-02-29T12:00:00Z",
    "2026-02-30T12:00:00Z",
    "2026-13-45T25:61:61Z",
    "2026-10-07T24:00:00Z",
  ]) {
    expect(valid(v), v).toBe(false);
  }
});

test("actions sending to another channel need a channel", () => {
  const valid = (action: object) =>
    messageActionSchema.safeParse(action).success;

  expect(valid({ type: 11, channel_id: "123", text: "Hi" })).toBe(true);
  expect(valid({ type: 11, channel_id: "", text: "Hi" })).toBe(false);
  expect(valid({ type: 12, channel_id: "123", target_id: "abc" })).toBe(true);
  expect(valid({ type: 12, target_id: "abc" })).toBe(false);
  expect(
    valid({ type: 12, channel_id: "123", message: { content: "Hi" } }),
  ).toBe(true);
});

/** A message whose button responds with `response`. */
function respondingMessage(response: unknown) {
  return {
    content: "Click below",
    components: [
      {
        id: 1,
        type: 1,
        components: [
          { id: 2, type: 2, style: 1, label: "Click", action_set_id: "set" },
        ],
      },
    ],
    actions: {
      set: { actions: [{ type: 5, id: 3, message: response }] },
    },
  };
}

test("a response can carry a message of its own", () => {
  const result = messageSchema.safeParse(
    respondingMessage({ content: "", embeds: [{ id: 4, title: "Thanks!" }] }),
  );

  expect(result.success).toBe(true);
});

test("issues in a response message are flagged where they are", () => {
  const result = messageSchema.safeParse(respondingMessage({ content: "" }));
  const issues = result.success ? [] : result.error.issues;

  expect(issues.map((issue) => issue.path)).toEqual([
    ["actions", "set", "actions", 0, "message", "content"],
  ]);
});

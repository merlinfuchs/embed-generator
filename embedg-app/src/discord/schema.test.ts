import { expect, test } from "vitest";
import {
  COMPONENTS_V2_FLAG,
  embedImageUrlSchema,
  embedTextLength,
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

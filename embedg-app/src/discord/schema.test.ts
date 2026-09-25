import { expect, test } from "vitest";
import { embedImageUrlSchema, unfurledMediaItemSchema } from "./schema";

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

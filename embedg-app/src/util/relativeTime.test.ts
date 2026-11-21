import { expect, test } from "vitest";
import { formatRelative } from "./relativeTime";

test("relative times count in whole units, in both directions", () => {
  const now = 1_000_000;
  expect(formatRelative(now + 3 * 3600 + 59, now)).toBe("in 3 hours");
  expect(formatRelative(now - 2 * 86400, now)).toBe("2 days ago");
  expect(formatRelative(now - 90, now)).toBe("1 minute ago");
  expect(formatRelative(now, now)).toBe("now");
});

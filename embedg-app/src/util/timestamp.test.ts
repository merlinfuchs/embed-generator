import { expect, test } from "vitest";
import {
  formatRelative,
  formatTimestamp,
  timestampMarkdown,
  unixSeconds,
} from "./timestamp";

test("the markdown is the unix time in seconds and the style", () => {
  expect(unixSeconds("2026-11-10T06:15:00.900Z")).toBe(1794291300);
  expect(timestampMarkdown(1794291300, "R")).toBe("<t:1794291300:R>");
  expect(timestampMarkdown(1794291300)).toBe("<t:1794291300>");
});

test("relative times count in whole units, in both directions", () => {
  const now = 1_000_000;
  expect(formatRelative(now + 3 * 3600 + 59, now)).toBe("in 3 hours");
  expect(formatRelative(now - 2 * 86400, now)).toBe("2 days ago");
  expect(formatRelative(now - 90, now)).toBe("1 minute ago");
  expect(formatRelative(now, now)).toBe("now");
});

test("every style produces text", () => {
  for (const style of ["d", "D", "t", "T", "f", "F", "s", "S", "R"] as const) {
    expect(formatTimestamp(1794291300, style, 1794291300)).not.toBe("");
  }
});

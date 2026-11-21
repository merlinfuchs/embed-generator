import { expect, test } from "vitest";
import { formatTimestamp, timestampMarkdown, unixSeconds } from "./timestamp";

test("the markdown is the unix time in seconds and the style", () => {
  expect(unixSeconds("2026-11-10T06:15:00.900Z")).toBe(1794291300);
  expect(timestampMarkdown(1794291300, "R")).toBe("<t:1794291300:R>");
  expect(timestampMarkdown(1794291300)).toBe("<t:1794291300>");
});

test("every style produces text", () => {
  for (const style of ["d", "D", "t", "T", "f", "F", "s", "S", "R"] as const) {
    expect(formatTimestamp(1794291300, style, 1794291300)).not.toBe("");
  }
});

import { describe, expect, it } from "vitest";
// @ts-expect-error - markdown.js is untyped
import { toHTML } from "./markdown";

describe("toHTML", () => {
  it("escapes HTML in subtext", () => {
    const html = toHTML('-# <img src=x onerror="alert(1)">');

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("still renders inline formatting inside subtext", () => {
    expect(toHTML("-# **bold**")).toContain("<strong>bold</strong>");
  });

  it("escapes HTML in normal text", () => {
    expect(toHTML("<script>alert(1)</script>")).not.toContain("<script>");
  });

  it("drops javascript: links", () => {
    expect(toHTML("[click](javascript:alert(1))")).not.toContain("javascript:");
  });
});

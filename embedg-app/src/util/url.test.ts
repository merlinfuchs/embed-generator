import { describe, expect, it } from "vitest";
import { safeHref } from "./url";

describe("safeHref", () => {
  it("keeps http and https URLs", () => {
    expect(safeHref("https://example.com/a")).toBe("https://example.com/a");
    expect(safeHref("http://example.com")).toBe("http://example.com");
  });

  it("drops anything a browser shouldn't follow", () => {
    for (const url of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "/relative/path",
      "not a url",
      "",
      undefined,
      null,
    ]) {
      expect(safeHref(url)).toBeUndefined();
    }
  });
});

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

  it("keeps spaces inside inline code", () => {
    expect(toHTML("` a `")).toContain("<code> a </code>");
  });

  it("does not add a line break after a code block", () => {
    const html = toHTML("```\naaa\n```\nafter");

    expect(html).toContain("</pre>after");
    expect(html).not.toContain("</pre><br>");
  });

  it("keeps an empty line after a code block followed by a blank line", () => {
    expect(toHTML("```\naaa\n```\n\nafter")).toContain("</pre><br>after");
  });

  it("does not hard-code styles on code blocks", () => {
    expect(toHTML("```js\nconst x = 1;\n```")).not.toContain("style=");
  });

  it("renders ansi code blocks with colors, bold and underline", () => {
    const html = toHTML(
      "```ansi\n\x1b[1;4;31mhi\x1b[0m \x1b[42mbg\x1b[0m plain\n```",
    );

    expect(html).toContain(
      '<span class="ansi-bold ansi-underline ansi-fg-31">hi</span>',
    );
    expect(html).toContain('<span class="ansi-bg-42">bg</span>');
    expect(html).toContain(" plain");
    expect(html).not.toContain("\x1b");
  });

  it("escapes HTML inside ansi code blocks", () => {
    const html = toHTML("```ansi\n\x1b[31m<img src=x>\x1b[0m\n```");

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("trims spaces around the whole text", () => {
    expect(toHTML("  hello  ")).toBe("hello");
  });
});

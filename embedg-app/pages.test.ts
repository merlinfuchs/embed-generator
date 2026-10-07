import { expect, test } from "vitest";
import { pages, renderPage, renderPageHtml } from "./pages";

const shell = `<head>
    <!-- page-meta -->
    <title>Dev</title>
    <!-- /page-meta -->
  </head>
  <body><div id="root"></div></body>`;

test("an indexable page gets its own head, canonical url and text", () => {
  const page = pages.find((p) => p.path === "/tools/colored-text");
  if (!page) throw new Error("no colored text page");
  const html = renderPageHtml(shell, page);

  expect(html).not.toContain("<title>Dev</title>");
  expect(html).toContain(
    "<title>Discord Colored Text Generator | Embed Generator</title>",
  );
  expect(html).toContain(
    '<link rel="canonical" href="https://message.style/app/tools/colored-text" />',
  );
  expect(html).not.toContain("noindex");
  expect(html).toContain('<div id="root"><main><h1>');
});

test("the shared message page is noindex", () => {
  const page = pages.find((p) => p.file === "shared");
  if (!page) throw new Error("no shared page");
  const html = renderPageHtml(shell, page);

  expect(html).toContain('<meta name="robots" content="noindex" />');
  expect(html).not.toContain("canonical");
});

test("page text is escaped", () => {
  const html = renderPageHtml(shell, {
    file: "x",
    title: 'A "quoted" <title>',
    description: "a & b",
    heading: "<h1>",
    text: "<script>",
  });

  expect(html).toContain("<title>A &quot;quoted&quot; &lt;title&gt;</title>");
  expect(html).toContain('content="a &amp; b"');
  expect(html).not.toContain("<script>");
});

test("a shell without the page-meta block fails the build", () => {
  expect(() => renderPage("<head></head>", "")).toThrow();
});

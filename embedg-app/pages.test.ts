import { expect, test } from "vitest";
import {
  componentEmbedScript,
  pages,
  renderPage,
  renderPageHtml,
} from "./pages";

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

test("indexable pages get a component embed Discord accepts", () => {
  for (const page of pages.filter((p) => p.path)) {
    const html = renderPageHtml(shell, page);
    const json = html.match(
      /<script id="discord:component-embed" type="application\/json">(.*?)<\/script>/,
    )?.[1];
    if (!json) throw new Error(`no component embed for ${page.file}`);

    expect(new TextEncoder().encode(json).length).toBeLessThanOrEqual(3000);
    const { component } = JSON.parse(json);
    expect(component.type).toBe(17);
    expect(component.components[1].content).toContain(
      `(https://message.style/app${page.path})`,
    );
  }
});

test("component embed text is escaped", () => {
  const script = componentEmbedScript(
    {
      file: "x",
      title: "x",
      description: "# not a heading </script>",
      heading: "[a](b)",
      text: "x",
    },
    { byline: "x", open: "Open", docs: "https://message.style/docs" },
    "https://message.style/app/x",
  );

  expect(script.match(/<\/script>/g)).toHaveLength(1);
  const json = script.slice(script.indexOf(">") + 1, -"</script>".length);
  expect(JSON.parse(json).component.components[1].content).toBe(
    "## [\\[a\\](b)](https://message.style/app/x)\n\\# not a heading \\</script\\>",
  );
});

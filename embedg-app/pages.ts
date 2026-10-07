import type { Plugin } from "vite";

/**
 * App pages that people search for get their own HTML file with a title, description and a short
 * paragraph, so crawlers see more than an empty shell. Everything else is served the default
 * index.html, which is noindex: settings, saved messages and the like mean nothing to a visitor
 * from a search engine.
 *
 * The files are written to dist/pages and Caddy serves /app/<path> from pages/<path>.html, and
 * every shared message from pages/shared.html. The embedded server doesn't look for them,
 * self-hosted instances don't care about search.
 */

const ORIGIN = "https://message.style";
// brand-500 in the site's tailwind.config.js
const ACCENT_COLOR = 0x4e6ef2;
// Discord drops component embeds over 3,000 bytes, escape sequences counted at full length.
const COMPONENT_EMBED_MAX_BYTES = 3000;

interface Page {
  file: string;
  // The URL of an indexable page. Pages without one are noindex.
  path?: string;
  title: string;
  description: string;
  heading: string;
  text: string;
  // The Discord link preview, see componentEmbedScript.
  preview?: Preview;
}

interface Preview {
  byline: string;
  // Label of the button that opens the page.
  open: string;
  docs: string;
}

const toolPreview: Preview = {
  byline: "Embed Generator · Tools",
  open: "Open tool",
  docs: `${ORIGIN}/docs/tools`,
};

export const pages: Page[] = [
  {
    file: "editor",
    path: "/editor",
    title: "Discord Embed Builder | Embed Generator",
    description:
      "Build Discord embeds, buttons and select menus in a visual editor with a live preview, then send them through a webhook or bot. Free, no account needed.",
    heading: "Discord Embed Builder",
    preview: {
      byline: "Embed Generator",
      open: "Open Editor",
      docs: `${ORIGIN}/docs`,
    },
    text: "Write the message, add embeds with a title, description, fields, images and a color, and watch the preview update as you type. Paste a webhook URL to send it, or log in with Discord to send it through the bot with buttons and select menus that hand out roles or reply.",
  },
  {
    file: "scheduled",
    path: "/scheduled",
    title: "Schedule Discord Messages | Embed Generator",
    description:
      "Schedule a Discord message to be sent to a channel later, once at a set time or repeating every hour, day or week. Free to send once.",
    heading: "Schedule Discord Messages",
    preview: {
      byline: "Embed Generator",
      open: "Schedule a message",
      docs: `${ORIGIN}/docs/guides/scheduled-messages`,
    },
    text: "Pick a saved message with embeds and buttons, a channel in your server and a time, and the bot sends it then. Sending once is free, repeating schedules come with Premium.",
  },
  {
    file: "tools",
    path: "/tools",
    title: "Free Discord Tools | Embed Generator",
    description:
      "Free Discord tools: a colored text generator, embed links that unfurl into rich previews and a webhook info lookup. No account needed.",
    heading: "Free Discord Tools",
    preview: {
      byline: "Embed Generator · Tools",
      open: "All tools",
      docs: `${ORIGIN}/docs/tools`,
    },
    text: "Besides the message editor, Embed Generator has a few small tools: a colored text generator for ANSI code blocks, embed links that turn into a rich preview when posted, and a lookup that shows who created a webhook.",
  },
  {
    file: "tools/colored-text",
    path: "/tools/colored-text",
    title: "Discord Colored Text Generator | Embed Generator",
    description:
      "Color your Discord messages. Pick foreground and background colors per word and copy the result as an ANSI code block that works in any channel.",
    heading: "Discord Colored Text Generator",
    preview: toolPreview,
    text: "Discord renders ANSI color codes inside code blocks. Type your text, pick foreground and background colors for each part, and copy the code block into any Discord message.",
  },
  {
    file: "tools/embed-links",
    path: "/tools/embed-links",
    title: "Discord Embed Link Generator | Embed Generator",
    description:
      "Turn a title, description, image and color into a link that unfurls into a rich embed in Discord, without a webhook or bot.",
    heading: "Discord Embed Link Generator",
    preview: toolPreview,
    text: "An embed link is a URL that Discord shows as an embed when it's posted. Set a title, description, image and color, or a Components V2 layout, and share the link anywhere in Discord, no webhook or bot required.",
  },
  {
    file: "tools/webhook-info",
    path: "/tools/webhook-info",
    title: "Discord Webhook Info Lookup | Embed Generator",
    description:
      "Paste a Discord webhook URL to see the webhook's name, avatar, server and who created it.",
    heading: "Discord Webhook Info",
    preview: toolPreview,
    text: "Found an old webhook URL and don't remember what it's for? Paste it here to see the webhook's name, avatar and who created it.",
  },
  {
    // Every /editor/share/<id>. Shares expire after a week, so they aren't worth indexing.
    file: "shared",
    title: "Shared Message | Embed Generator",
    description:
      "A Discord message shared from Embed Generator. Open it to view and edit it in the editor.",
    heading: "Shared Message",
    text: "Someone shared a Discord message built with Embed Generator. It opens in the editor, where you can change it and send it through a webhook or bot.",
  },
];

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const META_START = "<!-- page-meta -->";
const META_END = "<!-- /page-meta -->";
const ROOT = '<div id="root"></div>';

// Text Display content is Discord markdown. Page text is plain text.
function escapeMarkdown(text: string): string {
  return text.replace(/[\\*_~`|[\]<>]/g, "\\$&").replace(/^[#>-]/, "\\$&");
}

/**
 * The Components V2 layout Discord shows instead of the Open Graph card when the link is posted:
 * https://discord.com/developers/docs/link-previews/component-embeds
 * Kept in line with the site's, see embedg-site/plugins/component-embeds.ts.
 */
export function componentEmbedScript(
  page: Page,
  preview: Preview,
  url: string,
): string {
  const embed = {
    component: {
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        { type: 10, content: `-# ${preview.byline}` },
        {
          type: 10,
          content: `## [${escapeMarkdown(page.heading)}](${url})\n${escapeMarkdown(page.description)}`,
        },
        { type: 12, items: [{ media: { url: `${ORIGIN}/img/og.png` } }] },
        { type: 14, divider: false, spacing: 1 },
        {
          type: 1,
          components: [
            { label: preview.open, url },
            { label: "Docs", url: preview.docs },
            { label: "Add to Discord", url: `${ORIGIN}/invite` },
          ].map((b) => ({ type: 2, style: 5, ...b })),
        },
      ],
    },
  };

  // Nothing in the payload may close the script element.
  const json = JSON.stringify(embed).replace(
    /[<>&]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
  const size = new TextEncoder().encode(json).length;
  if (size > COMPONENT_EMBED_MAX_BYTES) {
    throw new Error(
      `component embed for ${url} is ${size} bytes, Discord allows ${COMPONENT_EMBED_MAX_BYTES}`,
    );
  }
  return `<script id="discord:component-embed" type="application/json">${json}</script>`;
}

function pageMeta(page: Page): string {
  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
  ];
  if (page.path) {
    const url = `${ORIGIN}/app${page.path}`;
    tags.push(
      `<link rel="canonical" href="${url}" />`,
      `<meta property="og:url" content="${url}" />`,
    );
    if (page.preview) {
      tags.push(componentEmbedScript(page, page.preview, url));
    }
  } else {
    tags.push('<meta name="robots" content="noindex" />');
  }
  return tags.join("\n    ");
}

/** Replaces the page-meta block of index.html and, if given, the content of #root. */
export function renderPage(html: string, meta: string, body?: string): string {
  const start = html.indexOf(META_START);
  const end = html.indexOf(META_END);
  if (start === -1 || end === -1 || !html.includes(ROOT)) {
    throw new Error("index.html is missing the page-meta block or #root");
  }

  const out = `${html.slice(0, start + META_START.length)}\n    ${meta}\n    ${html.slice(end)}`;
  return body === undefined
    ? out
    : out.replace(ROOT, `<div id="root">${body}</div>`);
}

export function renderPageHtml(html: string, page: Page): string {
  return renderPage(
    html,
    pageMeta(page),
    `<main><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.text)}</p></main>`,
  );
}

export function renderSitemap(): string {
  const urls = pages
    .filter((p) => p.path)
    .map((p) => `  <url><loc>${ORIGIN}/app${p.path}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function pagesPlugin(): Plugin {
  return {
    name: "embedg-pages",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const index = bundle["index.html"];
      if (index?.type !== "asset" || typeof index.source !== "string") {
        throw new Error("no index.html in the bundle");
      }
      const html = index.source;

      for (const page of pages) {
        this.emitFile({
          type: "asset",
          fileName: `pages/${page.file}.html`,
          source: renderPageHtml(html, page),
        });
      }
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: renderSitemap(),
      });

      index.source = renderPage(
        html,
        [
          "<title>Embed Generator</title>",
          '<meta name="description" content="Create and send Discord messages with embeds, buttons and select menus." />',
          '<meta name="robots" content="noindex" />',
        ].join("\n    "),
      );
    },
  };
}

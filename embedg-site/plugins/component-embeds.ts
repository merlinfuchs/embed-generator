import { promises as fs } from "fs";
import path from "path";
import type { Plugin } from "@docusaurus/types";

/**
 * Gives every built page a component embed, the Components V2 layout Discord shows instead of the
 * Open Graph card when the link is posted:
 * https://discord.com/developers/docs/link-previews/component-embeds
 *
 * Discord doesn't run scripts, so the payload has to be in the HTML file. It is built from the meta
 * tags Docusaurus already wrote into each page, after the build, and the Open Graph tags stay as
 * the fallback for Discord and everywhere else.
 */

const ORIGIN = "https://message.style";
// brand-500 in tailwind.config.js
const ACCENT_COLOR = 0x4e6ef2;
// Discord drops payloads over 3,000 bytes, escape sequences counted at full length.
const MAX_BYTES = 3000;

const SECTIONS: { prefix: string; name: string; button: string }[] = [
  { prefix: "/docs", name: "Docs", button: "Read more" },
  { prefix: "/blog", name: "Blog", button: "Read post" },
];

export interface PageMeta {
  url: string;
  title: string;
  description?: string;
  image?: string;
  publishedTime?: string;
}

const SUFFIX = " | Embed Generator";

function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,
    (_, e: string) => {
      const lower = e.toLowerCase();
      if (lower.startsWith("#x"))
        return String.fromCodePoint(parseInt(lower.slice(2), 16));
      if (lower.startsWith("#"))
        return String.fromCodePoint(parseInt(lower.slice(1), 10));
      return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[lower] ?? "";
    },
  );
}

/** Reads the meta tags of a page the way Discord does: first non-empty value per key wins. */
export function readPageMeta(html: string): PageMeta | undefined {
  const head = html.slice(0, html.indexOf("</head>"));
  const meta = new Map<string, string>();
  for (const tag of head.match(/<meta\s[^>]*>/g) ?? []) {
    const key = tag.match(/\s(?:name|property)="([^"]*)"/)?.[1];
    const content = tag.match(/\scontent="([^"]*)"/)?.[1];
    if (key && content && !meta.has(key))
      meta.set(key, decodeEntities(content));
  }

  const url = meta.get("og:url");
  const title =
    meta.get("og:title") ??
    decodeEntities(head.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] ?? "");
  if (!url || !title) return undefined;

  return {
    url,
    title: title.endsWith(SUFFIX) ? title.slice(0, -SUFFIX.length) : title,
    description: meta.get("og:description") ?? meta.get("description"),
    image: meta.get("og:image"),
    publishedTime: meta.get("article:published_time"),
  };
}

// Text Display content is Discord markdown. Titles and descriptions are plain text.
export function escapeMarkdown(text: string): string {
  return text.replace(/[\\*_~`|[\]<>]/g, "\\$&").replace(/^[#>-]/, "\\$&");
}

export function buildComponentEmbed(page: PageMeta) {
  const pathname = new URL(page.url).pathname;
  const section = SECTIONS.find((s) => pathname.startsWith(s.prefix));

  const byline = ["Embed Generator"];
  if (section) byline.push(section.name);
  if (page.publishedTime) {
    byline.push(
      new Date(page.publishedTime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }),
    );
  }

  let text = `## [${escapeMarkdown(page.title)}](${page.url})`;
  // Index pages like /blog have their title as description.
  if (page.description && page.description !== page.title) {
    text += `\n${escapeMarkdown(page.description)}`;
  }

  const components: object[] = [
    { type: 10, content: `-# ${byline.join(" · ")}` },
    { type: 10, content: text },
  ];

  if (page.image) {
    components.push({ type: 12, items: [{ media: { url: page.image } }] });
  }

  const buttons =
    pathname === "/"
      ? [
          { label: "Open Editor", url: `${ORIGIN}/app` },
          { label: "Docs", url: `${ORIGIN}/docs` },
        ]
      : [
          { label: section?.button ?? "Open page", url: page.url },
          { label: "Open Editor", url: `${ORIGIN}/app` },
        ];
  buttons.push({ label: "Add to Discord", url: `${ORIGIN}/invite` });

  components.push(
    { type: 14, divider: false, spacing: 1 },
    { type: 1, components: buttons.map((b) => ({ type: 2, style: 5, ...b })) },
  );

  return { component: { type: 17, accent_color: ACCENT_COLOR, components } };
}

/** The script element for the head. Throws if Discord would drop the payload for its size. */
export function componentEmbedScript(embed: object): string {
  // Nothing in the payload may close the script element.
  const json = JSON.stringify(embed).replace(
    /[<>&]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
  const size = Buffer.byteLength(json);
  if (size > MAX_BYTES) {
    throw new Error(
      `component embed is ${size} bytes, Discord allows ${MAX_BYTES}`,
    );
  }
  return `<script id="discord:component-embed" type="application/json">${json}</script>`;
}

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, {
    withFileTypes: true,
    recursive: true,
  });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".html"))
    .map((e) => path.join(e.parentPath, e.name));
}

export default function componentEmbedsPlugin(): Plugin {
  return {
    name: "component-embeds",
    async postBuild({ outDir }) {
      for (const file of await htmlFiles(outDir)) {
        if (path.relative(outDir, file) === "404.html") continue;

        const html = await fs.readFile(file, "utf8");
        const page = readPageMeta(html);
        if (!page) continue;

        const script = componentEmbedScript(buildComponentEmbed(page));
        await fs.writeFile(file, html.replace("</head>", `${script}</head>`));
      }
    },
  };
}

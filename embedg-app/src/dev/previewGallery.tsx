import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import queryClient from "../api/client";
import MessagePreview from "../components/MessagePreview";
import { parseMessageWithAction } from "../discord/importSchema";
import "../index.css";

const IMAGE = "https://picsum.photos/seed/embedg";

function v2(components: unknown[]) {
  return parseMessageWithAction({
    content: "",
    flags: 1 << 15,
    embeds: [],
    components,
  });
}

const cases: [string, ReturnType<typeof v2>][] = [
  [
    "text only",
    v2([
      {
        type: 17,
        accent_color: 5793266,
        components: [
          {
            type: 10,
            content:
              "# Patch Notes\nFixed a bug where chests wouldn't open.\n- Server stability\n- New gravity\n-# Every third thursday",
          },
        ],
      },
    ]),
  ],
  [
    "text and a button row",
    v2([
      {
        type: 17,
        accent_color: 15548997,
        components: [
          { type: 10, content: "Hello!" },
          {
            type: 1,
            components: [
              { type: 2, style: 1, label: "Test" },
              {
                type: 2,
                style: 5,
                url: "https://message.style",
                label: "Open",
              },
            ],
          },
        ],
      },
    ]),
  ],
  [
    "section with a thumbnail",
    v2([
      {
        type: 17,
        accent_color: 1752220,
        components: [
          {
            type: 9,
            components: [
              {
                type: 10,
                content: "## New version out!\nThe dungeon is tougher.",
              },
            ],
            accessory: { type: 11, media: { url: `${IMAGE}1/200/200` } },
          },
        ],
      },
    ]),
  ],
  [
    "section with a button accessory",
    v2([
      {
        type: 17,
        components: [
          {
            type: 9,
            components: [{ type: 10, content: "**Store**\nBuy the thing." }],
            accessory: {
              type: 2,
              style: 5,
              url: "https://message.style",
              label: "Open",
            },
          },
        ],
      },
    ]),
  ],
  [
    "gallery, one item",
    v2([
      {
        type: 17,
        components: [
          { type: 12, items: [{ media: { url: `${IMAGE}2/800/450` } }] },
        ],
      },
    ]),
  ],
  [
    "gallery, three items",
    v2([
      {
        type: 17,
        components: [
          {
            type: 12,
            items: [
              { media: { url: `${IMAGE}3/800/450` } },
              { media: { url: `${IMAGE}4/800/450` } },
              { media: { url: `${IMAGE}5/800/450` } },
            ],
          },
        ],
      },
    ]),
  ],
  [
    "gallery, five items",
    v2([
      {
        type: 17,
        components: [
          {
            type: 12,
            items: [1, 2, 3, 4, 5].map((i) => ({
              media: { url: `${IMAGE}${i + 5}/800/450` },
            })),
          },
        ],
      },
    ]),
  ],
  [
    "separators and a file",
    v2([
      {
        type: 17,
        components: [
          { type: 10, content: "Above" },
          { type: 14, divider: true, spacing: 1 },
          { type: 10, content: "Between" },
          { type: 14, divider: false, spacing: 2 },
          { type: 10, content: "Below" },
          { type: 13, file: { url: "https://message.style/notes.txt" } },
        ],
      },
    ]),
  ],
  [
    "spoilers",
    v2([
      {
        type: 17,
        spoiler: true,
        components: [
          { type: 10, content: "Hidden until clicked" },
          {
            type: 12,
            items: [{ media: { url: `${IMAGE}9/800/450` }, spoiler: true }],
          },
        ],
      },
    ]),
  ],
  [
    "everything",
    v2([
      {
        type: 17,
        accent_color: 5763719,
        components: [
          { type: 10, content: "# Release 2.0" },
          {
            type: 9,
            components: [{ type: 10, content: "The dungeon is tougher." }],
            accessory: { type: 11, media: { url: `${IMAGE}10/200/200` } },
          },
          {
            type: 12,
            items: [
              { media: { url: `${IMAGE}11/800/450` } },
              { media: { url: `${IMAGE}12/800/450` } },
            ],
          },
          { type: 10, content: "*Screenshots of new content*" },
          { type: 14, divider: true, spacing: 1 },
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                url: "https://message.style",
                label: "Store",
              },
              {
                type: 2,
                style: 5,
                url: "https://message.style",
                label: "Community",
              },
            ],
          },
        ],
      },
    ]),
  ],
];

const unfurl = parseMessageWithAction({
  content: "https://message.style/e/123",
  embeds: [],
  components: [],
});

const unfurledContainer = {
  type: 17 as const,
  id: 1,
  accent_color: 5793266,
  components: [
    {
      type: 9 as const,
      id: 2,
      components: [
        {
          type: 10 as const,
          id: 3,
          content:
            "# **[New version out!](https://message.style)**\nThe dungeon is deceptively tougher.",
        },
      ],
      accessory: {
        type: 2 as const,
        id: 4,
        style: 5 as const,
        url: "https://message.style",
        label: "Open",
        action_set_id: "0",
      },
    },
    {
      type: 12 as const,
      id: 5,
      items: [
        { id: 6, media: { url: `${IMAGE}20/800/450` } },
        { id: 7, media: { url: `${IMAGE}21/800/450` } },
      ],
    },
  ],
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-ink-800 p-8 space-y-8">
        <div>
          <div className="uppercase text-mist-300 text-sm font-medium mb-2">
            link unfurled into a component embed
          </div>
          <MessagePreview msg={unfurl} unfurledComponent={unfurledContainer} />
        </div>
        {cases.map(([name, msg]) => (
          <div key={name}>
            <div className="uppercase text-mist-300 text-sm font-medium mb-2">
              {name}
            </div>
            <MessagePreview msg={msg} />
          </div>
        ))}
      </div>
    </QueryClientProvider>
  </StrictMode>,
);

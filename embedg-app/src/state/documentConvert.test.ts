import { describe, expect, test } from "vitest";
import { type Message, messageSchema } from "../discord/schema";
import type { DocumentData, Node, NodeId } from "./document";
import {
  childIds,
  childSlots,
  fromMessage,
  toMessage,
} from "./documentConvert";

function parse(raw: unknown): Message {
  return messageSchema.parse(raw);
}

const emptyMessage = parse({ content: "Hello" });

const embedMessage = parse({
  content: "",
  embeds: [
    {
      title: "First",
      description: "Description",
      url: "https://message.style",
      timestamp: "2026-01-01T00:00:00.000Z",
      color: 2326507,
      author: { name: "Author", url: "https://message.style" },
      footer: { text: "Footer" },
      image: { url: "https://message.style/image.png" },
      thumbnail: { url: "https://message.style/thumb.png" },
      fields: [
        { name: "A", value: "1", inline: true },
        { name: "B", value: "2" },
      ],
    },
    {
      description: "Second",
      fields: [{ name: "C", value: "3" }],
    },
  ],
});

const actionRowMessage = parse({
  content: "Components",
  components: [
    {
      type: 1,
      components: [
        { type: 2, style: 1, label: "Click" },
        { type: 2, style: 5, label: "Link", url: "https://message.style" },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 3,
          placeholder: "Pick one",
          options: [{ label: "One", description: "first" }, { label: "Two" }],
        },
      ],
    },
  ],
});

const componentsV2Message = parse({
  content: "",
  flags: 1 << 15,
  components: [
    {
      type: 17,
      accent_color: 2326507,
      components: [
        {
          type: 9,
          components: [{ type: 10, content: "Section text" }],
          accessory: {
            type: 11,
            media: { url: "https://message.style/thumb.png" },
            description: "thumb",
          },
        },
        { type: 10, content: "Standalone text" },
        {
          type: 12,
          items: [
            { media: { url: "https://message.style/one.png" } },
            { media: { url: "https://message.style/two.png" }, spoiler: true },
          ],
        },
        { type: 13, file: { url: "attachment://file.txt" } },
        { type: 14, divider: true, spacing: 2 },
      ],
    },
  ],
});

const fixtures: [string, Message][] = [
  ["empty message", emptyMessage],
  ["embeds with fields", embedMessage],
  ["v1 action rows", actionRowMessage],
  ["v2 container", componentsV2Message],
];

/** Path of every array element in the payload, as a zod-style path. */
function elementPaths(value: unknown, path = "", inArray = false): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, i) =>
      elementPaths(entry, `${path}.${i}`, true),
    );
  }
  if (value && typeof value === "object") {
    const paths = inArray ? [path] : [];
    for (const [key, entry] of Object.entries(value)) {
      // actions are keyed by action set id, not by node
      if (key === "actions") continue;
      paths.push(...elementPaths(entry, path ? `${path}.${key}` : key));
    }
    return paths;
  }
  return [];
}

function allNodeIds(state: DocumentData): NodeId[] {
  return Object.keys(state.nodes);
}

function subtree(state: DocumentData, id: NodeId): NodeId[] {
  const node = state.nodes[id] as Node;
  return [
    id,
    ...childSlots(node).flatMap((slot) =>
      childIds(node, slot).flatMap((childId) => subtree(state, childId)),
    ),
  ];
}

describe("round trip", () => {
  for (const [name, message] of fixtures) {
    test(name, () => {
      expect(toMessage(fromMessage(message)).message).toEqual(message);
    });
  }
});

describe("pathToId", () => {
  for (const [name, message] of fixtures) {
    test(name, () => {
      const {
        message: payload,
        pathToId,
        idToPath,
      } = toMessage(fromMessage(message));

      for (const path of elementPaths(payload)) {
        expect(pathToId.has(path), `missing path ${path}`).toBe(true);
      }
      for (const [path, id] of pathToId) {
        expect(idToPath.get(id)).toBe(path);
      }
    });
  }
});

test("toMessage is memoized on the nodes object", () => {
  const state = fromMessage(embedMessage);
  expect(toMessage(state)).toBe(toMessage(state));
});

test("parents point at their children", () => {
  const state = fromMessage(componentsV2Message);

  for (const id of allNodeIds(state)) {
    const node = state.nodes[id];
    for (const slot of childSlots(node)) {
      for (const childId of childIds(node, slot)) {
        expect(state.nodes[childId].parentId).toBe(id);
      }
    }
  }
});

test("a message with no components has only the root", () => {
  const state = fromMessage(emptyMessage);
  expect(allNodeIds(state)).toEqual([state.rootId]);
});

test("subtree ids are unique", () => {
  const state = fromMessage(componentsV2Message);
  const ids = subtree(state, state.rootId);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.length).toBe(allNodeIds(state).length);
});

test("select option action sets survive the round trip", () => {
  const withActions = parse({
    content: "",
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Click", action_set_id: "set-1" },
        ],
      },
    ],
    actions: { "set-1": { actions: [] } },
  });

  const { message } = toMessage(fromMessage(withActions));
  expect(message.actions).toEqual({ "set-1": { actions: [] } });
});

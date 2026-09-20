import { beforeEach, expect, test, vi } from "vitest";

/** Minimal localStorage so the persist middleware and the seeding can run. */
function fakeStorage(entries: Record<string, string> = {}) {
  const store = new Map(Object.entries(entries));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

/** What the message store used to persist, back when it owned the message. */
const draft = {
  state: {
    content: "Draft content",
    tts: false,
    embeds: [{ id: 1, title: "Draft embed", fields: [] }],
    components: [
      {
        type: 1,
        id: 2,
        components: [
          {
            type: 2,
            id: 3,
            style: 1,
            label: "Draft button",
            action_set_id: "set-1",
          },
        ],
      },
    ],
    actions: { "set-1": { actions: [] } },
  },
  version: 0,
};

async function documentAt(version: number, message: unknown) {
  const { fromMessage } = await import("./documentConvert");
  const { parseMessageWithAction } = await import("../discord/restoreSchema");

  return JSON.stringify({
    state: fromMessage(parseMessageWithAction(message)),
    version,
  });
}

async function seedWith(entries: Record<string, string>) {
  vi.stubGlobal("localStorage", fakeStorage(entries));

  const { seedDocumentStore, getCurrentMessage } = await import(
    "./currentMessage"
  );
  seedDocumentStore();

  return getCurrentMessage();
}

beforeEach(() => {
  vi.resetModules();
});

test("a draft with no document at all is taken over whole", async () => {
  const message = await seedWith({
    "current-message": JSON.stringify(draft),
  });

  expect(message.content).toBe("Draft content");
  expect(message.embeds).toMatchObject([{ title: "Draft embed" }]);
  expect(message.components).toMatchObject([
    { components: [{ label: "Draft button" }] },
  ]);
});

test("a version 1 document keeps its embeds and takes the rest", async () => {
  vi.resetModules();
  const document = await documentAt(1, {
    content: "",
    embeds: [{ title: "Document embed", fields: [] }],
    components: [],
  });

  const message = await seedWith({
    "current-message": JSON.stringify(draft),
    "current-document": document,
  });

  expect(message.embeds).toMatchObject([{ title: "Document embed" }]);
  expect(message.content).toBe("Draft content");
  expect(message.components).toMatchObject([
    { components: [{ label: "Draft button" }] },
  ]);
});

test("a version 2 document keeps its components and takes the root fields", async () => {
  vi.resetModules();
  const document = await documentAt(2, {
    content: "",
    embeds: [{ title: "Document embed", fields: [] }],
    components: [{ type: 10, content: "Document text" }],
  });

  const message = await seedWith({
    "current-message": JSON.stringify(draft),
    "current-document": document,
  });

  expect(message.embeds).toMatchObject([{ title: "Document embed" }]);
  expect(message.components).toMatchObject([{ content: "Document text" }]);
  expect(message.content).toBe("Draft content");
});

test("a current document is left alone", async () => {
  vi.resetModules();
  const document = await documentAt(3, {
    content: "Document content",
    embeds: [{ title: "Document embed", fields: [] }],
    components: [],
  });

  const message = await seedWith({
    "current-message": JSON.stringify(draft),
    "current-document": document,
  });

  expect(message.content).toBe("Document content");
  expect(message.embeds).toMatchObject([{ title: "Document embed" }]);
});

test("seeding without a draft keeps the default message", async () => {
  const { defaultMessage } = await import("../discord/defaultMessage");
  const message = await seedWith({});

  expect(message.embeds).toEqual(defaultMessage.embeds);
});

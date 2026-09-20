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

const draft = {
  state: {
    content: "Draft content",
    tts: false,
    embeds: [{ id: 1, title: "Draft embed", fields: [] }],
    components: [],
    actions: {},
  },
  version: 0,
};

beforeEach(() => {
  vi.resetModules();
});

test("seeding takes over the embeds of an existing draft", async () => {
  vi.stubGlobal(
    "localStorage",
    fakeStorage({ "current-message": JSON.stringify(draft) }),
  );

  const { seedDocumentStore, getCurrentMessage } = await import(
    "./currentMessage"
  );
  seedDocumentStore();

  expect(getCurrentMessage().embeds).toMatchObject([{ title: "Draft embed" }]);
});

test("a version 1 document keeps its embeds but takes the draft components", async () => {
  const { fromMessage } = await import("./documentConvert");
  const { messageSchema } = await import("../discord/schema");

  const v1 = fromMessage(
    messageSchema.parse({
      content: "",
      embeds: [{ title: "Document embed", fields: [] }],
      components: [],
    }),
  );

  vi.stubGlobal(
    "localStorage",
    fakeStorage({
      "current-message": JSON.stringify({
        state: {
          content: "",
          tts: false,
          embeds: [],
          components: [
            {
              type: 1,
              id: 1,
              components: [
                {
                  type: 2,
                  id: 2,
                  style: 1,
                  label: "Kept",
                  action_set_id: "set-1",
                },
              ],
            },
          ],
          actions: { "set-1": { actions: [] } },
        },
        version: 0,
      }),
      "current-document": JSON.stringify({ state: v1, version: 1 }),
    }),
  );

  const { seedDocumentStore, getCurrentMessage } = await import(
    "./currentMessage"
  );
  seedDocumentStore();

  const message = getCurrentMessage();
  expect(message.embeds).toMatchObject([{ title: "Document embed" }]);
  expect(message.components).toMatchObject([
    { type: 1, components: [{ label: "Kept" }] },
  ]);
  expect(message.actions).toHaveProperty("set-1");
});

test("seeding leaves an existing document alone", async () => {
  const { fromMessage } = await import("./documentConvert");
  const { messageSchema } = await import("../discord/schema");

  const existing = fromMessage(
    messageSchema.parse({
      content: "",
      embeds: [{ title: "Document embed", fields: [] }],
    }),
  );

  vi.stubGlobal(
    "localStorage",
    fakeStorage({
      "current-message": JSON.stringify(draft),
      "current-document": JSON.stringify({ state: existing, version: 2 }),
    }),
  );

  const { seedDocumentStore, getCurrentMessage } = await import(
    "./currentMessage"
  );
  seedDocumentStore();

  expect(getCurrentMessage().embeds).toMatchObject([
    { title: "Document embed" },
  ]);
});

test("seeding without a draft keeps the default message", async () => {
  vi.stubGlobal("localStorage", fakeStorage());

  const { seedDocumentStore, getCurrentMessage } = await import(
    "./currentMessage"
  );
  const { defaultMessage } = await import("../discord/defaultMessage");
  seedDocumentStore();

  expect(getCurrentMessage().embeds).toEqual(defaultMessage.embeds);
});

test("the merged message takes embeds from the document store", async () => {
  vi.stubGlobal("localStorage", fakeStorage());

  const { getCurrentMessage } = await import("./currentMessage");
  const { useDocumentStore } = await import("./document");
  const { useCurrentMessageStore } = await import("./message");
  const { messageSchema } = await import("../discord/schema");

  useCurrentMessageStore.getState().replace(
    messageSchema.parse({
      content: "From the message store",
      embeds: [{ title: "Stale embed", fields: [] }],
    }),
  );
  useDocumentStore.getState().replaceAll(
    messageSchema.parse({
      content: "",
      embeds: [{ title: "Live embed", fields: [] }],
    }),
  );

  const message = getCurrentMessage();
  expect(message.content).toBe("From the message store");
  expect(message.embeds).toMatchObject([{ title: "Live embed" }]);
});

import { beforeEach, expect, test } from "vitest";
import { parseMessageWithAction } from "../discord/importSchema";
import {
  DOCUMENT_VERSION,
  createDocumentStore,
  type MessageNode,
} from "./document";
import { fromMessage, toMessage } from "./documentConvert";

const KEY = "persist-probe";

const message = parseMessageWithAction({
  content: "Persisted content",
  embeds: [{ title: "Persisted embed", fields: [] }],
  components: [],
});

beforeEach(() => {
  localStorage.clear();
});

/**
 * Persistence is the one thing the editor cannot lose, and jsdom is the only
 * place a test sees the same storage the browser does.
 */
test("a stored document comes back", () => {
  localStorage.setItem(
    KEY,
    JSON.stringify({ state: fromMessage(message), version: DOCUMENT_VERSION }),
  );

  const store = createDocumentStore(KEY);

  expect(toMessage(store.getState()).message).toMatchObject({
    content: "Persisted content",
    embeds: [{ title: "Persisted embed" }],
  });
});

test("an edit is written back", () => {
  const store = createDocumentStore(KEY);
  const rootId = store.getState().rootId;

  store.getState().update<MessageNode>(rootId, { content: "Edited" });

  const stored = JSON.parse(localStorage.getItem(KEY) as string);
  expect(stored.version).toBe(DOCUMENT_VERSION);
  expect(stored.state.nodes[rootId].content).toBe("Edited");
});

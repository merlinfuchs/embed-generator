import { beforeEach, expect, test } from "vitest";
import {
  componentEmbedPayload,
  componentEmbedStore,
  ensureComponentEmbedContainer,
} from "./componentEmbed";

beforeEach(() => {
  componentEmbedStore.getState().clear();
});

test("the document is seeded with a single empty container", () => {
  const id = ensureComponentEmbedContainer();

  expect(componentEmbedStore.getState().nodes[id]?.type).toBe("container");
  expect(ensureComponentEmbedContainer()).toBe(id);
});

test("the payload is the container without the editor's own fields", () => {
  const containerId = ensureComponentEmbedContainer();
  const { insert } = componentEmbedStore.getState();

  insert(containerId, "components", "end", {
    type: "textDisplay",
    content: "# Patch Notes",
  });
  const rowId = insert(containerId, "components", "end", { type: "actionRow" });
  insert(rowId, "components", "end", {
    type: "button",
    style: 5,
    label: "Open",
    url: "https://message.style",
  });

  expect(componentEmbedPayload()).toEqual({
    component: {
      type: 17,
      components: [
        { type: 10, content: "# Patch Notes" },
        {
          type: 1,
          components: [
            { type: 2, style: 5, label: "Open", url: "https://message.style" },
          ],
        },
      ],
    },
  });
});

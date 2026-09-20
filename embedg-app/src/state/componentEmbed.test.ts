import { beforeEach, expect, test } from "vitest";
import { componentEmbedPayload, componentEmbedStore } from "./componentEmbed";
import { childIds } from "./documentConvert";

function containerId() {
  const state = componentEmbedStore.getState();
  return childIds(state.nodes[state.rootId], "components")[0];
}

beforeEach(() => {
  componentEmbedStore.getState().clear();
});

test("the document holds an empty container", () => {
  expect(componentEmbedStore.getState().nodes[containerId()]?.type).toBe(
    "container",
  );
  expect(componentEmbedPayload()).toEqual({
    component: { type: 17, components: [] },
  });
});

test("the payload is the container without the editor's own fields", () => {
  const { insert } = componentEmbedStore.getState();

  insert(containerId(), "components", "end", {
    type: "textDisplay",
    content: "# Patch Notes",
  });
  const rowId = insert(containerId(), "components", "end", {
    type: "actionRow",
  });
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

test("a custom emoji keeps its id", () => {
  const rowId = componentEmbedStore
    .getState()
    .insert(containerId(), "components", "end", { type: "actionRow" });
  componentEmbedStore.getState().insert(rowId, "components", "end", {
    type: "button",
    style: 5,
    label: "",
    url: "https://message.style",
    emoji: { id: "123", name: "wave", animated: false },
  });

  expect(componentEmbedPayload()?.component.components).toEqual([
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "",
          url: "https://message.style",
          emoji: { id: "123", name: "wave", animated: false },
        },
      ],
    },
  ]);
});

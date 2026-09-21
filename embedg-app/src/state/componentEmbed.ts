import { useStore } from "zustand";
import type { Message, MessageComponentContainer } from "../discord/schema";
import {
  COMPONENTS_V2_FLAG,
  createDocumentStore,
  type NodeId,
} from "./document";
import { childIds, toMessage } from "./documentConvert";

/** The payload is a single container, so the document is seeded with one. */
const emptyComponentEmbed: Message = {
  content: "",
  tts: false,
  embeds: [],
  components: [{ id: 0, type: 17, components: [] }],
  actions: {},
  flags: COMPONENTS_V2_FLAG,
};

/** The component embed of the link tool, kept apart from the message draft. */
export const componentEmbedStore = createDocumentStore(
  "current-component-embed",
  emptyComponentEmbed,
);

export const useComponentEmbedContainerId = (): NodeId | undefined =>
  useStore(
    componentEmbedStore,
    (state) => childIds(state.nodes[state.rootId], "components")[0],
  );

/**
 * Strips what only the editor uses. The node ids the editor hands out are
 * numbers, unlike the emoji id, which is a string and part of the payload.
 */
function stripEditorFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripEditorFields) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key, entry]) =>
            !(key === "id" && typeof entry === "number") &&
            key !== "action_set_id" &&
            entry !== undefined &&
            entry !== null,
        )
        .map(([key, entry]) => [key, stripEditorFields(entry)]),
    ) as T;
  }

  return value;
}

function componentEmbedContainer(
  state: ReturnType<typeof componentEmbedStore.getState>,
): MessageComponentContainer | null {
  const [container] = toMessage(state).message.components;

  return container?.type === 17 ? container : null;
}

/** The container as the preview renders it, editor fields and all. */
export const useComponentEmbedContainer = () =>
  useStore(componentEmbedStore, componentEmbedContainer);

export function componentEmbedPayload(): {
  component: MessageComponentContainer;
} | null {
  const container = componentEmbedContainer(componentEmbedStore.getState());
  if (!container) return null;

  return { component: stripEditorFields(container) };
}

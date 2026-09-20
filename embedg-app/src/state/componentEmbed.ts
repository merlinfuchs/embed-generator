import { useStore } from "zustand";
import { emptyComponentsV2Message } from "../discord/defaultMessage";
import type { MessageComponentContainer } from "../discord/schema";
import { createDocumentStore, type NodeId } from "./document";
import { toMessage } from "./documentConvert";

export const COMPONENT_EMBED_STORE_KEY = "current-component-embed";

/** The component embed of the link tool, kept apart from the message draft. */
export const componentEmbedStore = createDocumentStore(
  COMPONENT_EMBED_STORE_KEY,
);

function containerId(
  state: ReturnType<typeof componentEmbedStore.getState>,
): NodeId | undefined {
  const root = state.nodes[state.rootId];
  if (root?.type !== "message") return undefined;

  return root.componentIds.find((id) => state.nodes[id]?.type === "container");
}

export const useComponentEmbedContainerId = () =>
  useStore(componentEmbedStore, containerId);

/**
 * The payload is a single container, so the document holds exactly one. It is
 * created on first use and again if the editor ever loses it.
 */
export function ensureComponentEmbedContainer(): NodeId {
  const existing = containerId(componentEmbedStore.getState());
  if (existing) return existing;

  const { replaceAll } = componentEmbedStore.getState();
  replaceAll(emptyComponentsV2Message);

  const { insert, rootId } = componentEmbedStore.getState();
  return insert(rootId, "components", "end", { type: "container" });
}

/** Strips what only the editor uses, which Discord rejects the payload over. */
function stripEditorFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripEditorFields) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key, entry]) =>
            key !== "id" &&
            key !== "action_set_id" &&
            entry !== undefined &&
            entry !== null,
        )
        .map(([key, entry]) => [key, stripEditorFields(entry)]),
    ) as T;
  }

  return value;
}

export function componentEmbedPayload(): {
  component: MessageComponentContainer;
} | null {
  const { message } = toMessage(componentEmbedStore.getState());
  const container = message.components.find(
    (component): component is MessageComponentContainer =>
      component.type === 17,
  );
  if (!container) return null;

  return { component: stripEditorFields(container) };
}

import debounce from "just-debounce-it";
import { type TemporalState, temporal } from "zundo";
import { create, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";
import type {
  EmbedAuthor,
  EmbedFooter,
  EmbedImage,
  EmbedProvider,
  EmbedThumbnail,
  Emoji,
  Message,
  MessageActionSet,
  MessageComponentButtonStyle,
  UnfurledMediaItem,
} from "../discord/schema";
import { defaultMessage } from "../discord/defaultMessage";
import { getUniqueId } from "../util";
import { type ActionSetActions, createActionSetSlice } from "./actionSetSlice";
import {
  type ChildSlot,
  childIds,
  childSlots,
  fromMessage,
  setChildIds,
} from "./documentConvert";

export type NodeId = string;

/**
 * `discordId` is the numeric `id` that lives on embeds, fields and components in
 * the Discord payload. It's kept separate from `NodeId` so the wire format can
 * change without touching how the editor addresses nodes.
 */
interface BaseNode {
  id: NodeId;
  parentId: NodeId | null;
  discordId: number;
}

export type MessageNode = BaseNode & {
  type: "message";
  content: string;
  username?: string;
  avatar_url?: string;
  tts: boolean;
  thread_name?: string;
  flags?: number;
  allowed_mentions?: Message["allowed_mentions"];
  embedIds: NodeId[];
  componentIds: NodeId[];
};

export type EmbedNode = BaseNode & {
  type: "embed";
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: EmbedFooter;
  author?: EmbedAuthor;
  provider?: EmbedProvider;
  image?: EmbedImage;
  thumbnail?: EmbedThumbnail;
  fieldIds: NodeId[];
};

export type EmbedFieldNode = BaseNode & {
  type: "embedField";
  name: string;
  value: string;
  inline?: boolean;
};

export type ActionRowNode = BaseNode & {
  type: "actionRow";
  childIds: NodeId[];
};

export type ButtonNode = BaseNode & {
  type: "button";
  style: MessageComponentButtonStyle;
  label: string;
  emoji?: Emoji | null;
  url?: string;
  disabled?: boolean;
  action_set_id: string;
};

export type SelectMenuNode = BaseNode & {
  type: "selectMenu";
  placeholder?: string;
  disabled?: boolean;
  optionIds: NodeId[];
};

export type SelectOptionNode = BaseNode & {
  type: "selectOption";
  label: string;
  description?: string;
  emoji?: Emoji | null;
  action_set_id: string;
};

export type ContainerNode = BaseNode & {
  type: "container";
  accent_color?: number;
  spoiler?: boolean;
  childIds: NodeId[];
};

export type SectionNode = BaseNode & {
  type: "section";
  childIds: NodeId[];
  accessoryId: NodeId | null;
};

export type TextDisplayNode = BaseNode & {
  type: "textDisplay";
  content: string;
};

export type ThumbnailNode = BaseNode & {
  type: "thumbnail";
  media: UnfurledMediaItem;
  description?: string;
  spoiler?: boolean;
};

export type MediaGalleryNode = BaseNode & {
  type: "mediaGallery";
  itemIds: NodeId[];
};

export type MediaGalleryItemNode = BaseNode & {
  type: "mediaGalleryItem";
  media: UnfurledMediaItem;
  description?: string;
  spoiler?: boolean;
};

export type FileNode = BaseNode & {
  type: "file";
  file: UnfurledMediaItem;
  spoiler?: boolean;
};

export type SeparatorNode = BaseNode & {
  type: "separator";
  divider: boolean;
  spacing: 1 | 2;
};

export type Node =
  | MessageNode
  | EmbedNode
  | EmbedFieldNode
  | ActionRowNode
  | ButtonNode
  | SelectMenuNode
  | SelectOptionNode
  | ContainerNode
  | SectionNode
  | TextDisplayNode
  | ThumbnailNode
  | MediaGalleryNode
  | MediaGalleryItemNode
  | FileNode
  | SeparatorNode;

export type NodeType = Node["type"];

type Primitive = string | number | boolean | bigint | symbol;

/** Bookkeeping that is never addressed by validation. */
type Bookkeeping = "id" | "parentId" | "discordId" | "type";

/**
 * The fields of a node as zod issue paths, e.g. `"author.name"`. Keeps a typo
 * from compiling into a lookup that silently matches nothing. Two levels deep,
 * which is as far as the message schema nests inside a node.
 */
export type FieldPath<T> = {
  [K in keyof Omit<T, Bookkeeping> & string]: NonNullable<T[K]> extends
    | Primitive
    | readonly unknown[]
    ? K
    : K | `${K}.${keyof NonNullable<T[K]> & string}`;
}[keyof Omit<T, Bookkeeping> & string];

type DistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;

/** Everything `insert` fills in itself. */
type DerivedKeys =
  | "id"
  | "parentId"
  | "discordId"
  | "embedIds"
  | "componentIds"
  | "fieldIds"
  | "childIds"
  | "optionIds"
  | "itemIds"
  | "accessoryId"
  | "action_set_id";

export type NewNode = DistributiveOmit<Node, DerivedKeys>;

export interface DocumentData {
  nodes: Record<NodeId, Node>;
  rootId: NodeId;
  actions: Record<string, MessageActionSet>;
}

export interface DocumentStore extends DocumentData, ActionSetActions {
  update<T extends Node>(
    id: NodeId,
    patch: Partial<Omit<T, "id" | "type" | "parentId">>,
  ): void;
  insert(
    parentId: NodeId,
    slot: ChildSlot,
    index: number | "end",
    node: NewNode,
  ): NodeId;
  remove(id: NodeId): void;
  removeChildren(parentId: NodeId, slot: ChildSlot): void;
  move(id: NodeId, delta: -1 | 1): void;
  duplicate(id: NodeId): NodeId;
  replaceAll(message: Message): void;
  clear(): void;
  setComponentsV2(enabled: boolean): void;
}

export const COMPONENTS_V2_FLAG = 1 << 15;

export const DOCUMENT_STORE_KEY = "current-document";

/** 2 is the first version that owns components and their action sets. */
export const DOCUMENT_VERSION = 2;

const hadPersistedDocument =
  typeof localStorage !== "undefined" &&
  localStorage.getItem(DOCUMENT_STORE_KEY) !== null;

/** Set by `migrate` when an older document is loaded. */
let migratedFrom: number | null = null;

function freshId(nodes: Record<NodeId, Node>): NodeId {
  let id = getUniqueId().toString();
  while (nodes[id]) {
    id = getUniqueId().toString();
  }
  return id;
}

/** The empty child arrays that a node of this type needs. */
function emptyChildren(type: NodeType) {
  switch (type) {
    case "message":
      return { embedIds: [], componentIds: [] };
    case "embed":
      return { fieldIds: [] };
    case "actionRow":
    case "container":
      return { childIds: [] };
    case "section":
      return { childIds: [], accessoryId: null };
    case "selectMenu":
      return { optionIds: [] };
    case "mediaGallery":
      return { itemIds: [] };
    default:
      return {};
  }
}

function usesActionSet(node: { type: NodeType }): boolean {
  return node.type === "button" || node.type === "selectOption";
}

/** Collects `id` and every node below it, deepest last. */
function descendants(nodes: Record<NodeId, Node>, id: NodeId): NodeId[] {
  const node = nodes[id];
  if (!node) return [];

  const found = [id];
  for (const slot of childSlots(node)) {
    for (const childId of childIds(node, slot)) {
      found.push(...descendants(nodes, childId));
    }
  }
  return found;
}

function slotOfChild(parent: Node, childId: NodeId): ChildSlot | null {
  for (const slot of childSlots(parent)) {
    if (childIds(parent, slot).includes(childId)) return slot;
  }
  return null;
}

export const createDocumentStore = (key: string) =>
  create<DocumentStore>()(
    immer(
      persist(
        temporal(
          (set, get) => ({
            ...fromMessage(defaultMessage),

            update: (id, patch) =>
              set((state) => {
                const node = state.nodes[id];
                if (!node) return;
                Object.assign(node, patch);
              }),

            insert: (parentId, slot, index, node) => {
              const id = freshId(get().nodes);

              set((state) => {
                const parent = state.nodes[parentId];
                if (!parent) return;

                // An accessory slot holds a single node, so inserting replaces.
                if (slot === "accessory") {
                  for (const existing of childIds(parent, slot)) {
                    removeSubtree(state, existing);
                  }
                }

                const created = {
                  ...node,
                  ...emptyChildren(node.type),
                  id,
                  parentId,
                  discordId: getUniqueId(),
                } as Node;

                if (usesActionSet(created)) {
                  const actionSetId = getUniqueId().toString();
                  (created as ButtonNode | SelectOptionNode).action_set_id =
                    actionSetId;
                  state.actions[actionSetId] = { actions: [] };
                }

                state.nodes[id] = created;

                const ids = [...childIds(parent, slot)];
                ids.splice(index === "end" ? ids.length : index, 0, id);
                setChildIds(parent, slot, ids);
              });

              return id;
            },

            remove: (id) =>
              set((state) => {
                if (id === state.rootId) return;
                removeSubtree(state, id);
              }),

            removeChildren: (parentId, slot) =>
              set((state) => {
                const parent = state.nodes[parentId];
                if (!parent) return;

                for (const childId of [...childIds(parent, slot)]) {
                  removeSubtree(state, childId);
                }
              }),

            move: (id, delta) =>
              set((state) => {
                const node = state.nodes[id];
                if (!node?.parentId) return;

                const parent = state.nodes[node.parentId];
                if (!parent) return;

                const slot = slotOfChild(parent, id);
                if (!slot) return;

                const ids = [...childIds(parent, slot)];
                const index = ids.indexOf(id);
                const target = index + delta;
                if (target < 0 || target >= ids.length) return;

                ids.splice(index, 1);
                ids.splice(target, 0, id);
                setChildIds(parent, slot, ids);
              }),

            duplicate: (id) => {
              const copyId = freshId(get().nodes);
              let copied = false;

              set((state) => {
                const node = state.nodes[id];
                if (!node?.parentId) return;

                const parent = state.nodes[node.parentId];
                if (!parent) return;

                const slot = slotOfChild(parent, id);
                // An accessory slot only holds one node, nothing to duplicate into.
                if (!slot || slot === "accessory") return;

                copySubtree(state, id, node.parentId, copyId);
                copied = true;

                const ids = [...childIds(parent, slot)];
                ids.splice(ids.indexOf(id) + 1, 0, copyId);
                setChildIds(parent, slot, ids);
              });

              // Nothing was copied for a root or accessory node, so the caller
              // gets the node it asked about rather than a dangling id.
              return copied ? copyId : id;
            },

            ...createActionSetSlice<DocumentStore>(set),

            replaceAll: (message) => set(fromMessage(message)),

            clear: () => set(fromMessage(defaultMessage)),

            setComponentsV2: (enabled) =>
              set((state) => {
                const root = state.nodes[state.rootId];
                if (root?.type !== "message") return;

                const flags = root.flags ?? 0;
                root.flags = enabled
                  ? flags | COMPONENTS_V2_FLAG
                  : flags & ~COMPONENTS_V2_FLAG;
              }),
          }),
          {
            limit: 10,
            handleSet: (handleSet) => debounce(handleSet, 1000, true),
            partialize: (state) => ({
              nodes: state.nodes,
              rootId: state.rootId,
              actions: state.actions,
            }),
          },
        ),
        {
          name: key,
          version: DOCUMENT_VERSION,
          // The node tree itself is unchanged between versions; what a version
          // says is which parts of the message this store owns, which
          // `seedDocumentStore` reconciles once both stores have rehydrated.
          migrate: (persisted, version) => {
            migratedFrom = version;
            return persisted as DocumentStore;
          },
        },
      ),
    ),
  );

/** Detaches `id` from its parent and drops it and everything below it. */
function removeSubtree(state: DocumentData, id: NodeId) {
  const node = state.nodes[id];
  if (!node) return;

  if (node.parentId) {
    const parent = state.nodes[node.parentId];
    const slot = parent && slotOfChild(parent, id);
    if (parent && slot) {
      setChildIds(
        parent,
        slot,
        childIds(parent, slot).filter((childId) => childId !== id),
      );
    }
  }

  for (const removedId of descendants(state.nodes, id)) {
    const removed = state.nodes[removedId];
    if (removed && usesActionSet(removed)) {
      delete state.actions[
        (removed as ButtonNode | SelectOptionNode).action_set_id
      ];
    }
    delete state.nodes[removedId];
  }
}

/** Deep copies `id` under `parentId`, giving every node fresh ids. */
function copySubtree(
  state: DocumentData,
  id: NodeId,
  parentId: NodeId | null,
  copyId: NodeId,
): NodeId {
  const node = state.nodes[id];
  const copy = {
    ...node,
    id: copyId,
    parentId,
    discordId: getUniqueId(),
  } as Node;

  if (usesActionSet(copy)) {
    const source = (node as ButtonNode | SelectOptionNode).action_set_id;
    const actionSetId = getUniqueId().toString();
    (copy as ButtonNode | SelectOptionNode).action_set_id = actionSetId;
    state.actions[actionSetId] = {
      actions: state.actions[source]
        ? state.actions[source].actions.map((action) => ({ ...action }))
        : [],
    };
  }

  state.nodes[copyId] = copy;

  for (const slot of childSlots(node)) {
    const copies = childIds(node, slot).map((childId) =>
      copySubtree(state, childId, copyId, freshId(state.nodes)),
    );
    setChildIds(copy, slot, copies);
  }

  return copyId;
}

/**
 * What was in storage before this store rehydrated: no document at all, one
 * written by an older version, or one this version already owns. The key has
 * to be read before the store is created, because the persist middleware
 * writes it as soon as it rehydrates; the version comes from `migrate`, which
 * only runs when there is something older to upgrade.
 */
export function persistedDocument(): "none" | "current" | number {
  if (!hadPersistedDocument) return "none";

  return migratedFrom ?? "current";
}

export const useDocumentStore = createDocumentStore(DOCUMENT_STORE_KEY);

/** The undo stack only tracks the document itself, not the store actions. */
export const useDocumentUndoStore = <T>(
  selector: (state: TemporalState<DocumentData>) => T,
) => useStore(useDocumentStore.temporal, selector);

export const useNode = <T extends Node>(id: NodeId) =>
  useDocumentStore((state) => state.nodes[id] as T | undefined);

export const useChildIds = (id: NodeId, slot: ChildSlot) =>
  useDocumentStore((state) => childIds(state.nodes[id], slot), shallow);

/** Position of a node among its siblings, for move and duplicate buttons. */
export const useNodeIndex = (id: NodeId) =>
  useDocumentStore((state) => {
    const node = state.nodes[id];
    const parent = node?.parentId ? state.nodes[node.parentId] : undefined;
    const slot = parent && slotOfChild(parent, id);
    const ids = slot ? childIds(parent, slot) : [];

    return { index: ids.indexOf(id), count: ids.length };
  }, shallow);

/**
 * The move, duplicate and remove buttons of a node, hidden at the ends of its
 * slot and once `max` siblings exist.
 */
export function useNodeActions(id: NodeId, max?: number) {
  const { index, count } = useNodeIndex(id);
  const { move, duplicate, remove } = useDocumentStore.getState();

  return {
    moveUp: index > 0 ? () => move(id, -1) : undefined,
    moveDown: index < count - 1 ? () => move(id, 1) : undefined,
    duplicate:
      max === undefined || count < max ? () => duplicate(id) : undefined,
    remove: () => remove(id),
  };
}

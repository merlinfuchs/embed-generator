import { type NodeId, useDocumentStore, useNodeIndex } from "../state/document";

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

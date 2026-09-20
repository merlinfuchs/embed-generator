import type { ZodError, ZodIssue } from "zod";
import { create } from "zustand";
import type { FieldPath, Node, NodeId } from "./document";
import type { ChildSlot } from "./documentConvert";

/** A single field, addressed by node or by path. */
export type ValidationTarget = { nodeId: NodeId; field?: string } | string;

/** Anything with issues below it, addressed by node or by path. */
export type ValidationScope =
  | { nodeId: NodeId; fields?: string[] }
  | string
  | string[];

/** A field of a node, checked against that node's shape. */
export function nodeField<T extends Node>(
  nodeId: NodeId,
  field: FieldPath<T>,
): ValidationTarget {
  return { nodeId, field };
}

/** A node, or some of its fields, checked against that node's shape. */
export function nodeScope<T extends Node>(
  nodeId: NodeId,
  fields?: FieldPath<T>[],
): ValidationScope {
  return fields ? { nodeId, fields } : { nodeId };
}

/**
 * A child array of a node, e.g. the `fields` of an embed. Slots are named
 * after the payload, which is not always what the node calls them.
 */
export function slotScope(nodeId: NodeId, slot: ChildSlot): ValidationScope {
  return { nodeId, fields: [slot] };
}

/**
 * Issues indexed by the path they sit at, plus every path that has an issue
 * somewhere below it, so that a lookup is a map hit instead of a scan over
 * every issue.
 */
interface ValidationIndex {
  issues: Map<string, ZodIssue>;
  prefixes: Set<string>;
}

function buildIndex(error: ZodError | null): ValidationIndex {
  const index: ValidationIndex = { issues: new Map(), prefixes: new Set() };
  if (!error) return index;

  for (const issue of error.issues) {
    let path = "";
    for (let i = 0; i < issue.path.length; i++) {
      path = i === 0 ? String(issue.path[i]) : `${path}.${issue.path[i]}`;
      index.prefixes.add(path);
    }

    // The first issue at a path wins, matching what the UI showed before.
    if (!index.issues.has(path)) {
      index.issues.set(path, issue);
    }
  }

  return index;
}

function join(path: string, field?: string) {
  if (!field) return path;

  return path ? `${path}.${field}` : field;
}

export interface ValidationErrorStore {
  index: ValidationIndex;
  /** Node ids to zod issue paths, from the conversion that was validated. */
  idToPath: Map<NodeId, string>;
  setError(error: ZodError | null, idToPath: Map<NodeId, string>): void;
  getIssue(target: ValidationTarget): ZodIssue | null;
  hasIssue(scope: ValidationScope): boolean;
  hasAnyIssue(): boolean;
}

export const useValidationErrorStore = create<ValidationErrorStore>()(
  (set, get) => ({
    index: buildIndex(null),
    idToPath: new Map(),
    setError: (error, idToPath) => {
      const state = get();

      // A message that stays valid is the common case, and republishing the
      // index there would wake every subscriber for the same empty result.
      if (
        !error &&
        state.index.issues.size === 0 &&
        state.idToPath === idToPath
      ) {
        return;
      }

      set({ index: buildIndex(error), idToPath });
    },
    getIssue: (target) => {
      const state = get();

      if (typeof target === "string") {
        return state.index.issues.get(target) ?? null;
      }

      const path = state.idToPath.get(target.nodeId);
      if (path === undefined) return null;

      return state.index.issues.get(join(path, target.field)) ?? null;
    },
    hasIssue: (scope) => {
      const state = get();

      if (typeof scope === "string") return state.index.prefixes.has(scope);
      if (Array.isArray(scope)) {
        return scope.some((prefix) => state.index.prefixes.has(prefix));
      }

      const path = state.idToPath.get(scope.nodeId);
      if (path === undefined) return false;

      return scope.fields
        ? scope.fields.some((field) =>
            state.index.prefixes.has(join(path, field)),
          )
        : state.index.prefixes.has(path);
    },
    hasAnyIssue: () => get().index.issues.size > 0,
  }),
);

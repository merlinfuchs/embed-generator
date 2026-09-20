import type { ZodError, ZodIssue } from "zod";
import { create } from "zustand";
import type { NodeId } from "./document";

/**
 * Issues indexed by the path they sit at, plus every path that has an issue
 * somewhere below it. Built once per validation run so that a lookup is a map
 * hit instead of a scan over every issue.
 */
interface ValidationIndex {
  issues: Map<string, ZodIssue>;
  prefixes: Set<string>;
  idToPath: Map<NodeId, string>;
}

const emptyIndex: ValidationIndex = {
  issues: new Map(),
  prefixes: new Set(),
  idToPath: new Map(),
};

function buildIndex(
  error: ZodError | null,
  idToPath: Map<NodeId, string>,
): ValidationIndex {
  const index: ValidationIndex = {
    issues: new Map(),
    prefixes: new Set(),
    idToPath,
  };
  if (!error) return index;

  for (const issue of error.issues) {
    const segments = issue.path?.map(String) ?? [];
    const path = segments.join(".");

    // The first issue at a path wins, matching what the UI showed before.
    if (!index.issues.has(path)) {
      index.issues.set(path, issue);
    }

    for (let i = 1; i <= segments.length; i++) {
      index.prefixes.add(segments.slice(0, i).join("."));
    }
  }

  return index;
}

function nodePath(
  index: ValidationIndex,
  id: NodeId,
  field?: string,
): string | null {
  const path = index.idToPath.get(id);
  if (path === undefined) return null;
  if (!field) return path;

  return path ? `${path}.${field}` : field;
}

export interface ValidationErrorStore {
  index: ValidationIndex;
  setError(error: ZodError | null, idToPath?: Map<NodeId, string>): void;
  getIssueByPath(path: string): ZodIssue | null;
  checkIssueByPathPrefix(path: string): boolean;
  /** The issue on a node, or on one of its own fields, e.g. `author.name`. */
  getIssueForNode(id: NodeId, field?: string): ZodIssue | null;
  /** Whether a node, or one of its fields, has an issue at or below it. */
  hasIssueForNode(id: NodeId, field?: string): boolean;
}

export const useValidationErrorStore = create<ValidationErrorStore>()(
  (set, get) => ({
    index: emptyIndex,
    setError: (error, idToPath) =>
      set((state) => ({
        index: buildIndex(error, idToPath ?? state.index.idToPath),
      })),
    getIssueByPath: (path) => get().index.issues.get(path) ?? null,
    checkIssueByPathPrefix: (path) => get().index.prefixes.has(path),
    getIssueForNode: (id, field) => {
      const path = nodePath(get().index, id, field);

      return path === null ? null : (get().index.issues.get(path) ?? null);
    },
    hasIssueForNode: (id, field) => {
      const path = nodePath(get().index, id, field);

      return path === null ? false : get().index.prefixes.has(path);
    },
  }),
);

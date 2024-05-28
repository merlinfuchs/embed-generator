import { ZodError, ZodIssue } from "zod";
import { create } from "zustand";

export interface ValidationErrorStore {
  error: ZodError | null;
  setError(error: ZodError | null): void;
  getIssueByPath(path: string): ZodIssue | null;
  checkIssueByPathPrefix(path: string): boolean;
}

export const useValidationErrorStore = create<ValidationErrorStore>()(
  (set, get) => ({
    error: null,
    setError: (error) => {
      set({ error });
    },
    getIssueByPath: (path) => {
      const state = get();
      if (!state.error) return null;

      for (const issue of state.error.issues) {
        if (issue.path?.join(".") === path) {
          return issue;
        }
      }
      return null;
    },
    checkIssueByPathPrefix: (path) => {
      const state = get();
      if (!state.error) return false;

      for (const issue of state.error.issues) {
        if (issue.path?.join(".").startsWith(path)) {
          return true;
        }
      }
      return false;
    },
  })
);
